<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\SocialPost;
use App\Services\CerebrasService;
use App\Services\ZernioService;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Social webhook proxy.
 *
 * Each method here is a Laravel-gated entry point that the React UI calls.
 * When `services.social.webhook_base` is configured, the request is
 * forwarded to the matching n8n workflow with a shared header secret;
 * the upstream JSON is passed straight back to the browser.
 *
 * When the webhook isn't configured yet (early development), each method
 * returns realistic stub data so the UI can be built and demoed before
 * the n8n side is live.
 *
 * All routes are behind `auth + portal:admin` so unauthenticated callers
 * never reach this code. Zernio / OpenRouter / other LLM keys live
 * exclusively in the n8n workflow — they are never sent to the browser.
 */
class AiAdsWebhookController extends Controller
{
    /** GET /webhook/social/stats — real counts from the variant pipeline. */
    public function stats(Request $request)
    {
        $weekStart = now()->startOfWeek();

        $activeCampaigns = SocialPost::whereIn('status', [SocialPost::STATUS_AWAITING, SocialPost::STATUS_SCHEDULED])
            ->distinct()->count('campaign_id');

        return response()->json([
            'activeCampaigns' => $activeCampaigns,
            'pendingVariants' => SocialPost::where('status', SocialPost::STATUS_AWAITING)->count(),
            'scheduledThisWeek' => SocialPost::where('status', SocialPost::STATUS_SCHEDULED)
                ->where('scheduled_at', '>=', $weekStart)->count(),
            'leadsThisWeek' => Lead::where('created_at', '>=', $weekStart)->count(),
            'deltas' => [
                'activeCampaigns' => 0, 'pendingVariants' => 0,
                'scheduledThisWeek' => 0, 'leadsThisWeek' => 0,
            ],
        ]);
    }

    /** POST /webhook/social/generate-variants */
    public function generateVariants(Request $request)
    {
        $data = $request->validate([
            'campaign_name' => 'required|string|max:160',
            'service' => 'required|in:education,immigration,accommodation',
            'hook_angle' => 'nullable|string|max:300',
            'target_audience' => 'nullable|string|max:400',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'string|max:32',
            'variant_count' => 'nullable|integer|min:1|max:10',
            'tone' => 'nullable|in:friendly,professional,urgent,inspirational',
            // Optional reference asset uploaded as multipart. The Laravel
            // side just streams it through to n8n if configured; the stub
            // path ignores it.
            'reference' => 'nullable|file|max:10240',
        ]);

        $cerebras = app(CerebrasService::class);
        $count = max(1, min(5, (int) ($data['variant_count'] ?? 3)));
        $campaignId = SocialPost::campaignId($data['campaign_name']);
        $variants = [];

        try {
            foreach ($data['platforms'] as $platform) {
                // Cerebras tailors copy per platform; fall back to fixtures when
                // no key is set so the review queue still works in dev.
                $copies = $cerebras->configured()
                    ? $cerebras->generateSocialVariants(array_merge($data, ['platform' => $platform, 'variant_count' => $count]))
                    : $this->stubCopies($data['service'], $count);

                foreach ($copies as $c) {
                    $post = SocialPost::create([
                        'campaign_id' => $campaignId,
                        'campaign_name' => $data['campaign_name'],
                        'service' => $data['service'],
                        'platform' => $platform,
                        'headline' => $c['headline'] ?? null,
                        'body' => $c['body'] ?? null,
                        'cta' => $c['cta'] ?? null,
                        'hashtags' => $c['hashtags'] ?? [],
                        'model' => $cerebras->configured() ? 'cerebras' : 'stub',
                        'status' => SocialPost::STATUS_AWAITING,
                        'created_by' => $request->user()?->id,
                    ]);
                    $variants[] = $post->toVariant();
                }
            }
        } catch (\Throwable $e) {
            Log::error('Variant generation failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Generation failed. Please try again.'], 500);
        }

        return response()->json(['ok' => true, 'generated' => count($variants), 'variants' => $variants]);
    }

    /** GET /webhook/social/list-variants — the awaiting-review queue. */
    public function listVariants(Request $request)
    {
        $variants = SocialPost::where('status', SocialPost::STATUS_AWAITING)
            ->latest()->get()->map(fn (SocialPost $p) => $p->toVariant());

        return response()->json(['variants' => $variants]);
    }

    /** POST /webhook/social/update-variant — edit a variant's copy. */
    public function updateVariant(Request $request)
    {
        $data = $request->validate([
            'variantId' => 'required|string|max:64',
            'headline' => 'required|string|max:200',
            'body' => 'required|string|max:2000',
            'cta' => 'required|string|max:120',
        ]);

        $post = SocialPost::where('status', SocialPost::STATUS_AWAITING)->findOrFail($data['variantId']);
        $post->update(['headline' => $data['headline'], 'body' => $data['body'], 'cta' => $data['cta']]);

        return response()->json(['ok' => true]);
    }

    /** POST /webhook/social/reject-variant */
    public function rejectVariant(Request $request)
    {
        $data = $request->validate([
            'variantId' => 'required|string|max:64',
        ]);

        SocialPost::where('id', $data['variantId'])->update(['status' => SocialPost::STATUS_REJECTED]);

        return response()->json(['ok' => true]);
    }

    /**
     * POST /webhook/social/approve-variant — publish or schedule the variant
     * through Zernio (or mark it scheduled locally when Zernio isn't set up).
     */
    public function approveVariant(Request $request)
    {
        $data = $request->validate([
            'variantId' => 'required|string|max:64',
            'scheduleAt' => 'required|date',
            'platformIds' => 'nullable|array',
            'platformIds.*' => 'string|max:32',
        ]);

        $post = SocialPost::findOrFail($data['variantId']);
        $when = Carbon::parse($data['scheduleAt']);
        $platforms = ! empty($data['platformIds']) ? $data['platformIds'] : [$post->platform];

        if ($z = $this->zernio()) {
            return $this->zernioJson(function () use ($z, $post, $platforms, $when, $data) {
                $targets = $z->platformTargets($platforms);
                if (empty($targets)) {
                    abort(422, 'None of the chosen platforms have a connected Zernio account.');
                }

                $res = $z->createPost($post->composeContent(), $targets, $when->isFuture() ? $data['scheduleAt'] : null);
                $post->update([
                    'status' => $when->isFuture() ? SocialPost::STATUS_SCHEDULED : SocialPost::STATUS_PUBLISHED,
                    'zernio_post_id' => $res['post_id'] ?? null,
                    'scheduled_at' => $when,
                ]);

                return ['ok' => true, 'post_id' => $res['post_id'] ?? null];
            });
        }

        // No Zernio yet — record the approval so the pipeline is testable.
        $post->update(['status' => SocialPost::STATUS_SCHEDULED, 'scheduled_at' => $when]);

        return response()->json(['ok' => true]);
    }

    /** GET /webhook/social/list-scheduled */
    public function listScheduled(Request $request)
    {
        $data = $request->validate([
            'from' => 'nullable|date',
            'to' => 'nullable|date',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => ['posts' => $z->listPosts(['status' => 'scheduled'])]);
        }

        return $this->forwardOrStub('GET', 'list-scheduled', $data, function () {
            $services = ['education', 'immigration', 'accommodation'];
            $platforms = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'];
            $posts = [];
            // Spread fixture posts across the current week so the calendar
            // looks populated in dev. Mix of past/future via day offsets.
            $base = now()->startOfWeek();
            for ($i = 0; $i < 12; $i++) {
                $posts[] = [
                    'id' => 'p_'.Str::random(6),
                    'variant_id' => 'v_'.Str::random(6),
                    'campaign_name' => 'Sample Campaign #'.(($i % 3) + 1),
                    'service' => $services[$i % count($services)],
                    'platform' => $platforms[$i % count($platforms)],
                    'headline' => $this->stubHeadline($services[$i % count($services)]),
                    'schedule_at' => $base->copy()->addDays(($i * 2) % 7)->addHours(9 + ($i % 6))->toIso8601String(),
                ];
            }

            return ['posts' => $posts];
        });
    }

    /** POST /webhook/social/reschedule */
    public function reschedule(Request $request)
    {
        $data = $request->validate([
            'postId' => 'required|string|max:64',
            'newScheduleAt' => 'required|date',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->updatePost($data['postId'], [
                'scheduledFor' => $data['newScheduleAt'],
                'timezone' => (string) config('app.timezone', 'UTC'),
            ]));
        }

        return $this->forwardOrStub('POST', 'reschedule', $data, fn () => ['ok' => true]);
    }

    /** POST /webhook/social/cancel-post */
    public function cancelPost(Request $request)
    {
        $data = $request->validate([
            'postId' => 'required|string|max:64',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->deletePost($data['postId']));
        }

        return $this->forwardOrStub('POST', 'cancel-post', $data, fn () => ['ok' => true]);
    }

    /** POST /webhook/social/quick-post */
    public function quickPost(Request $request)
    {
        $data = $request->validate([
            'text' => 'required|string|max:2000',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'string|max:32',
            'media' => 'nullable|file|max:10240',
            'schedule_at' => 'nullable|date',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(function () use ($z, $data, $request) {
                $targets = $z->platformTargets($data['platforms']);
                if (empty($targets)) {
                    abort(422, 'None of the selected platforms have a connected Zernio account.');
                }

                // Upload an attached image/video to Zernio first, then reference
                // its public URL on the post.
                $mediaItems = [];
                if ($request->hasFile('media')) {
                    $item = $z->uploadMedia($request->file('media'));
                    if (! empty($item['url'])) {
                        $mediaItems[] = $item;
                    }
                }

                return $z->createPost($data['text'], $targets, $data['schedule_at'] ?? null, null, $mediaItems);
            });
        }

        return $this->forwardOrStub('POST', 'quick-post', $data, fn () => [
            'ok' => true,
            'post_id' => 'p_'.Str::random(8),
        ]);
    }

    /** GET /webhook/social/list-accounts */
    public function listAccounts(Request $request)
    {
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->listAccounts());
        }

        return $this->forwardOrStub('GET', 'list-accounts', null, fn () => [
            'accounts' => [
                [
                    'id' => 'a_'.Str::random(6),
                    'platform' => 'instagram',
                    'handle' => '@epathways_nz',
                    'status' => 'active',
                    'last_post_at' => now()->subDays(2)->toIso8601String(),
                ],
                [
                    'id' => 'a_'.Str::random(6),
                    'platform' => 'facebook',
                    'handle' => '@epathwaysnz',
                    'status' => 'active',
                    'last_post_at' => now()->subDays(2)->toIso8601String(),
                ],
                [
                    'id' => 'a_'.Str::random(6),
                    'platform' => 'tiktok',
                    'handle' => '@epathways.nz',
                    'status' => 'needs_reauth',
                    'last_post_at' => now()->subDays(2)->toIso8601String(),
                ],
            ],
        ]);
    }

    /** POST /webhook/social/start-oauth */
    public function startOauth(Request $request)
    {
        $data = $request->validate([
            'platform' => 'required|string|max:32',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->connectUrl($data['platform']));
        }

        return $this->forwardOrStub('POST', 'start-oauth', $data, fn () => [
            'url' => 'https://example.com/oauth/start?platform='.$data['platform'],
        ]);
    }

    /** POST /webhook/social/disconnect */
    public function disconnectAccount(Request $request)
    {
        $data = $request->validate([
            'accountId' => 'required|string|max:64',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->disconnect($data['accountId']));
        }

        return $this->forwardOrStub('POST', 'disconnect', $data, fn () => ['ok' => true]);
    }

    // ── Inbox (Phase 3) ─────────────────────────────────────────────────

    /** GET /webhook/social/inbox-conversations */
    public function inboxConversations(Request $request)
    {
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->listConversations());
        }

        return response()->json(['conversations' => []]);
    }

    /** GET /webhook/social/inbox-messages?conversationId=&accountId= */
    public function inboxMessages(Request $request)
    {
        $data = $request->validate([
            'conversationId' => 'required|string|max:120',
            'accountId' => 'required|string|max:120',
        ]);
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->conversationMessages($data['conversationId'], $data['accountId']));
        }

        return response()->json(['messages' => []]);
    }

    /** POST /webhook/social/inbox-send */
    public function inboxSend(Request $request)
    {
        $data = $request->validate([
            'conversationId' => 'required|string|max:120',
            'accountId' => 'required|string|max:120',
            'text' => 'required|string|max:2000',
        ]);
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->sendMessage($data['conversationId'], $data['accountId'], $data['text']));
        }

        return response()->json(['error' => 'Connect Zernio to send messages.'], 422);
    }

    /** POST /webhook/social/inbox-read — mark a conversation read. */
    public function inboxRead(Request $request)
    {
        $data = $request->validate([
            'conversationId' => 'required|string|max:120',
            'accountId' => 'required|string|max:120',
        ]);
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->markRead($data['conversationId'], $data['accountId']));
        }

        return response()->json(['ok' => true]);
    }

    /**
     * GET /webhook/social/inbox-signal — a cheap "did anything change" stamp the
     * browser polls every ~1.5s. It only moves when the Zernio webhook fires,
     * so refetches happen the moment a real message arrives, not on a timer.
     */
    public function inboxSignal(Request $request)
    {
        return response()->json(['at' => (int) Cache::get('social.inbox.event_at', 0)]);
    }

    /**
     * POST /webhook/zernio — public inbound receiver for Zernio events (new
     * messages, comments). Bumps the inbox signal so open browsers refresh
     * within ~1.5s. Verified by Zernio's HMAC-SHA256 signature in the
     * X-Zernio-Signature header (computed over the raw body with the webhook's
     * Secret Key, which must equal ZERNIO_WEBHOOK_SECRET). Outside auth + CSRF.
     */
    public function zernioWebhook(Request $request)
    {
        $secret = (string) config('services.zernio.webhook_secret');
        if ($secret !== '') {
            $provided = (string) $request->header('X-Zernio-Signature', '');
            // Zernio may send the hash bare or prefixed with "sha256=".
            $providedHash = str_starts_with($provided, 'sha256=') ? substr($provided, 7) : $provided;
            $expected = hash_hmac('sha256', $request->getContent(), $secret);
            if ($providedHash === '' || ! hash_equals($expected, $providedHash)) {
                abort(401);
            }
        }

        Cache::put('social.inbox.event_at', now()->timestamp, now()->addDay());
        Log::info('Zernio webhook received', ['event' => $request->input('event') ?? $request->input('type')]);

        return response()->json(['ok' => true]);
    }

    /** GET /webhook/social/inbox-comments */
    public function inboxComments(Request $request)
    {
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->listComments());
        }

        return response()->json(['comments' => []]);
    }

    /** POST /webhook/social/inbox-reply-comment */
    public function inboxReplyComment(Request $request)
    {
        $data = $request->validate([
            'postId' => 'required|string|max:120',
            'accountId' => 'required|string|max:120',
            'text' => 'required|string|max:2000',
        ]);
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->replyComment($data['postId'], $data['accountId'], $data['text']));
        }

        return response()->json(['error' => 'Connect Zernio to reply.'], 422);
    }

    // ── Ads (Phase 3) ───────────────────────────────────────────────────

    /** GET /webhook/social/published-posts — published posts available to boost. */
    public function publishedPosts(Request $request)
    {
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->publishedPosts($request->query('accountId')));
        }

        return response()->json(['posts' => []]);
    }

    /** GET /webhook/social/ads-list */
    public function adsList(Request $request)
    {
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->listAds());
        }

        return response()->json(['ads' => []]);
    }

    /** GET /webhook/social/ad-accounts */
    public function adAccounts(Request $request)
    {
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->listAdAccounts());
        }

        return response()->json(['adAccounts' => []]);
    }

    /** POST /webhook/social/ads-boost — boost a published post into a paid ad. */
    public function adsBoost(Request $request)
    {
        $data = $request->validate([
            'postId' => 'required|string|max:120',
            'accountId' => 'required|string|max:120',
            'adAccountId' => 'required|string|max:120',
            'platform' => 'required|string|max:32',
            'name' => 'required|string|max:160',
            'goal' => 'required|string|max:40',
            'budgetAmount' => 'required|numeric|min:1',
            'budgetType' => 'required|in:daily,lifetime',
            'startDate' => 'nullable|date',
            'endDate' => 'nullable|date|after:startDate',
            'targeting' => 'nullable|array',
            'targeting.ageMin' => 'nullable|integer|min:13|max:65',
            'targeting.ageMax' => 'nullable|integer|min:13|max:65',
            'targeting.gender' => 'nullable|in:all,male,female',
            'targeting.countries' => 'nullable|array|max:25',
            'targeting.countries.*' => 'string|size:2',
            'targeting.interests' => 'nullable|array|max:30',
            'targeting.interests.*.id' => 'required_with:targeting.interests|string|max:120',
            'targeting.interests.*.name' => 'required_with:targeting.interests|string|max:160',
            'targeting.advantageAudience' => 'nullable|boolean',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->boostPost(array_filter([
                'postId' => $data['postId'],
                'accountId' => $data['accountId'],
                'adAccountId' => $data['adAccountId'],
                'platform' => $data['platform'],
                'name' => $data['name'],
                'goal' => $data['goal'],
                'budget' => ['amount' => (float) $data['budgetAmount'], 'type' => $data['budgetType']],
                'schedule' => array_filter([
                    'startDate' => $data['startDate'] ?? null,
                    'endDate' => $data['endDate'] ?? null,
                ]),
                'targeting' => $this->boostTargeting($data['targeting'] ?? []),
            ], fn ($v) => $v !== null && $v !== [])));
        }

        return response()->json(['error' => 'Connect Zernio (and a linked ad account) to boost.'], 422);
    }

    /** Shape the boost targeting payload for Zernio (drops empty fields). */
    private function boostTargeting(array $t): array
    {
        $targeting = array_filter([
            'ageMin' => $t['ageMin'] ?? null,
            'ageMax' => $t['ageMax'] ?? null,
            'gender' => in_array($t['gender'] ?? 'all', ['male', 'female'], true) ? $t['gender'] : null,
            'countries' => ! empty($t['countries']) ? array_values(array_map('strtoupper', $t['countries'])) : null,
            'interests' => ! empty($t['interests']) ? array_values(array_map(fn ($i) => [
                'id' => (string) $i['id'], 'name' => (string) $i['name'],
            ], $t['interests'])) : null,
        ], fn ($v) => $v !== null && $v !== []);

        if (! empty($t['advantageAudience'])) {
            $targeting['advantage_audience'] = 1;
        }

        return $targeting;
    }

    /** Shape the full create-ad targeting payload for Zernio's /ads/create. */
    private function createAdTargeting(array $t): array
    {
        $geo = fn ($arr) => array_values(array_filter(array_map(fn ($g) => array_filter([
            'key' => $g['key'] ?? null, 'name' => $g['name'] ?? null,
        ], fn ($v) => $v !== null && $v !== ''), is_array($arr) ? $arr : []), fn ($g) => ! empty($g['key'])));

        $entities = fn ($arr) => array_values(array_filter(array_map(fn ($e) => [
            'id' => (string) ($e['id'] ?? ''), 'name' => (string) ($e['name'] ?? ''),
        ], is_array($arr) ? $arr : []), fn ($e) => $e['id'] !== ''));

        $targeting = array_filter([
            'ageMin' => $t['ageMin'] ?? null,
            'ageMax' => $t['ageMax'] ?? null,
            'gender' => in_array($t['gender'] ?? 'all', ['male', 'female'], true) ? $t['gender'] : null,
            'incomeTier' => in_array($t['incomeTier'] ?? '', ['top_5', 'top_10', 'top_10_25', 'top_25_50'], true) ? $t['incomeTier'] : null,
            'countries' => ! empty($t['countries']) ? array_values(array_map('strtoupper', $t['countries'])) : null,
            'regions' => $geo($t['regions'] ?? []),
            'cities' => $geo($t['cities'] ?? []),
            'metros' => $geo($t['metros'] ?? []),
            'zips' => $geo($t['zips'] ?? []),
            'interests' => $entities($t['interests'] ?? []),
            'behaviors' => $entities($t['behaviors'] ?? []),
        ], fn ($v) => $v !== null && $v !== []);

        if (! empty($t['advantageAudience'])) {
            $targeting['advantage_audience'] = 1;
        }

        return $targeting;
    }

    /** POST /webhook/social/create-ad — launch a standalone ad with custom creative. */
    public function createAd(Request $request)
    {
        $data = $request->validate([
            'accountId' => 'required|string|max:120',
            'adAccountId' => 'required|string|max:120',
            'platform' => 'required|string|max:32',
            'name' => 'required|string|max:255',
            'goal' => 'required|string|max:40',
            'body' => 'required|string|max:2000',
            'headline' => 'nullable|string|max:255',
            'callToAction' => 'nullable|in:LEARN_MORE,SHOP_NOW,SIGN_UP,BOOK_TRAVEL,CONTACT_US,DOWNLOAD,GET_OFFER,GET_QUOTE,SUBSCRIBE,WATCH_MORE',
            'linkUrl' => 'nullable|url|max:2000',
            'budgetAmount' => 'required|numeric|min:1',
            'budgetType' => 'required|in:daily,lifetime',
            'media' => 'nullable|file|max:30720',
            'targeting' => 'nullable|array',
            'targeting.ageMin' => 'nullable|integer|min:13|max:65',
            'targeting.ageMax' => 'nullable|integer|min:13|max:65',
            'targeting.gender' => 'nullable|in:all,male,female',
            'targeting.incomeTier' => 'nullable|in:top_5,top_10,top_10_25,top_25_50',
            'targeting.countries' => 'nullable|array|max:25',
            'targeting.countries.*' => 'string|size:2',
            'targeting.regions' => 'nullable|array|max:50',
            'targeting.cities' => 'nullable|array|max:100',
            'targeting.metros' => 'nullable|array|max:50',
            'targeting.zips' => 'nullable|array|max:200',
            'targeting.interests' => 'nullable|array|max:50',
            'targeting.interests.*.id' => 'required_with:targeting.interests|string|max:120',
            'targeting.behaviors' => 'nullable|array|max:50',
            'targeting.behaviors.*.id' => 'required_with:targeting.behaviors|string|max:120',
            'targeting.advantageAudience' => 'nullable|boolean',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(function () use ($z, $data, $request) {
                $imageUrl = null;
                if ($request->hasFile('media')) {
                    $imageUrl = $z->uploadMedia($request->file('media'))['url'] ?? null;
                }

                return $z->createAd([
                    'accountId' => $data['accountId'],
                    'adAccountId' => $data['adAccountId'],
                    'platform' => $data['platform'],
                    'name' => $data['name'],
                    'goal' => $data['goal'],
                    'body' => $data['body'],
                    'headline' => $data['headline'] ?? null,
                    'callToAction' => $data['callToAction'] ?? null,
                    'linkUrl' => $data['linkUrl'] ?? null,
                    'imageUrl' => $imageUrl,
                    'budgetAmount' => (float) $data['budgetAmount'],
                    'budgetType' => $data['budgetType'],
                    'targeting' => $this->createAdTargeting($data['targeting'] ?? []),
                ]);
            });
        }

        return response()->json(['error' => 'Connect Zernio (and a linked ad account) to create ads.'], 422);
    }

    /** POST /webhook/social/ai-ad-copy — Cerebras writes the primary text + headline. */
    public function aiAdCopy(Request $request)
    {
        $data = $request->validate([
            'brief' => 'required|string|max:2000',
            'platform' => 'nullable|string|max:32',
            'goal' => 'nullable|string|max:40',
        ]);

        $ai = app(\App\Services\AIService::class);
        if (! $ai->configured()) {
            return response()->json(['error' => 'Set OPENROUTER_API_KEY to generate ad copy.'], 422);
        }

        $copy = $ai->generateAdCreative($data['brief'], $data['platform'] ?? 'facebook');
        if ($copy['headline'] === '' && $copy['body'] === '') {
            return response()->json(['error' => 'AI copy generation failed — please try again.'], 502);
        }

        return response()->json(['headline' => $copy['headline'], 'body' => $copy['body'], 'cta' => '']);
    }

    /** GET /webhook/social/ad-targeting-search?q=&dimension=&accountId=&geoType=&countryCode= */
    public function adTargetingSearch(Request $request)
    {
        $data = $request->validate([
            'q' => 'required|string|max:120',
            'accountId' => 'required|string|max:120',
            'dimension' => 'nullable|in:interest,geo,behavior,income',
            'geoType' => 'nullable|in:country,region,city,zip,metro',
            'countryCode' => 'nullable|string|size:2',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->searchTargeting(
                $data['accountId'], $data['q'], $data['dimension'] ?? 'interest',
                array_filter(['geoType' => $data['geoType'] ?? null, 'countryCode' => $data['countryCode'] ?? null])
            ));
        }

        return response()->json(['results' => []]);
    }

    /**
     * POST /webhook/social/ai-targeting — Cerebras suggests an audience for the
     * post, then we resolve the suggested interest names to Zernio interest ids.
     */
    public function aiTargeting(Request $request)
    {
        $data = $request->validate([
            'content' => 'required|string|max:4000',
            'accountId' => 'required|string|max:120',
            'goal' => 'nullable|string|max:40',
            'platform' => 'nullable|string|max:32',
        ]);

        $ai = app(\App\Services\AIService::class);
        if (! $ai->configured()) {
            return response()->json(['error' => 'Set OPENROUTER_API_KEY to use AI targeting.'], 422);
        }

        $s = $ai->suggestAdTargeting([
            'content' => $data['content'],
            'goal' => $data['goal'] ?? 'traffic',
            'platform' => $data['platform'] ?? 'facebook',
        ]);

        // Resolve interest keyword names → Zernio {id, name}. Best-effort.
        $interests = [];
        $unresolved = [];
        if ($z = $this->zernio()) {
            foreach ($s['interests'] as $name) {
                try {
                    $hit = $z->searchTargeting($data['accountId'], $name, 'interest', ['limit' => 1])['results'][0] ?? null;
                    $hit && $hit['id'] !== '' ? $interests[] = ['id' => $hit['id'], 'name' => $hit['name']] : $unresolved[] = $name;
                } catch (\Throwable $e) {
                    $unresolved[] = $name;
                }
            }
        } else {
            $unresolved = $s['interests'];
        }

        return response()->json([
            'ageMin' => $s['ageMin'],
            'ageMax' => $s['ageMax'],
            'countries' => $s['countries'],
            'interests' => $interests,
            'unresolved' => $unresolved,
            'rationale' => $s['rationale'],
        ]);
    }

    /** GET /webhook/social/ad-audiences?accountId=&adAccountId=&platform= — saved targeting presets. */
    public function adAudiences(Request $request)
    {
        $data = $request->validate([
            'accountId' => 'required|string|max:120',
            'adAccountId' => 'required|string|max:120',
            'platform' => 'nullable|string|max:32',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->listSavedAudiences($data['accountId'], $data['adAccountId'], $data['platform'] ?? null));
        }

        return response()->json(['presets' => []]);
    }

    /** POST /webhook/social/ad-audience-save — store the current targeting as a preset. */
    public function adAudienceSave(Request $request)
    {
        $data = $request->validate([
            'accountId' => 'required|string|max:120',
            'name' => 'required|string|max:160',
            'spec' => 'required|array',
        ]);

        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->createSavedAudience($data['accountId'], $data['name'], $data['spec']));
        }

        return response()->json(['error' => 'Connect Zernio to save audiences.'], 422);
    }

    /** GET /webhook/social/ad-analytics?adId= */
    public function adAnalytics(Request $request)
    {
        $data = $request->validate(['adId' => 'required|string|max:120']);
        if ($z = $this->zernio()) {
            return $this->zernioJson(fn () => $z->adAnalytics($data['adId']));
        }

        return response()->json([], 200);
    }

    // ── Performance (Phase 2b) ──────────────────────────────────────────

    /** GET /webhook/social/analytics — post performance joined with lead counts. */
    public function analytics(Request $request)
    {
        $data = $request->validate([
            'fromDate' => 'nullable|date',
            'toDate' => 'nullable|date',
        ]);

        $from = isset($data['fromDate']) ? Carbon::parse($data['fromDate']) : now()->subDays(30);
        $to = isset($data['toDate']) ? Carbon::parse($data['toDate']) : now();
        $leads = Lead::whereBetween('created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])->count();

        if ($z = $this->zernio()) {
            return $this->zernioJson(function () use ($z, $from, $to, $leads) {
                $a = $z->analytics([
                    'fromDate' => $from->toDateString(),
                    'toDate' => $to->toDateString(),
                    'sortBy' => 'engagement',
                    'order' => 'desc',
                    'limit' => 50,
                ]);
                $a['leads'] = $leads;

                return $a;
            });
        }

        return response()->json([
            'posts' => [],
            'leads' => $leads,
            'totals' => ['impressions' => 0, 'reach' => 0, 'engagement' => 0, 'clicks' => 0, 'posts' => 0],
        ]);
    }

    // ── helpers ─────────────────────────────────────────────────────────

    /** The Zernio client when a key is configured, else null (→ n8n/stub). */
    private function zernio(): ?ZernioService
    {
        $z = app(ZernioService::class);

        return $z->configured() ? $z : null;
    }

    /** Run a Zernio call, returning a JSON 502 on failure. */
    private function zernioJson(callable $fn)
    {
        try {
            return response()->json($fn());
        } catch (RequestException $e) {
            // Zernio/the ad platform returned an HTTP error — surface its own
            // human message (Meta's error_user_msg, else Zernio's `error`) and
            // map 4xx to 422 (user-actionable: billing, budget, CTA…) rather
            // than a scary 502, which we keep for genuine gateway failures.
            $body = $e->response?->json() ?? [];
            $title = $body['platformError']['error_user_title'] ?? null;
            $msg = $body['platformError']['error_user_msg'] ?? $body['error'] ?? $e->getMessage();
            $message = $title ? $title.': '.$msg : $msg;
            $status = $e->response && $e->response->status() >= 400 && $e->response->status() < 500 ? 422 : 502;
            Log::warning('Zernio request rejected', ['status' => $e->response?->status(), 'error' => $message]);

            return response()->json(['error' => $message], $status);
        } catch (\Throwable $e) {
            Log::error('Zernio call failed', ['error' => $e->getMessage()]);

            return response()->json(['error' => 'Could not reach Zernio: '.$e->getMessage()], 502);
        }
    }

    /**
     * Forward to n8n if configured, otherwise return $stubFactory().
     * $payload is the JSON body for POSTs, query array for GETs.
     */
    private function forwardOrStub(string $method, string $path, $payload, callable $stubFactory)
    {
        $base = config('services.social.webhook_base');
        if (! $base) {
            return response()->json($stubFactory());
        }

        $url = rtrim($base, '/').'/'.$path;
        $secret = config('services.social.webhook_secret');

        try {
            $request = Http::timeout(30);
            if ($secret) {
                $request = $request->withHeaders(['X-Webhook-Secret' => $secret]);
            }

            $response = $method === 'GET'
                ? $request->get($url, is_array($payload) ? $payload : [])
                : $request->post($url, is_array($payload) ? $payload : []);

            if (! $response->successful()) {
                Log::warning('Social webhook upstream error', [
                    'path' => $path, 'status' => $response->status(),
                ]);

                return response()->json(['error' => 'Upstream returned '.$response->status()], $response->status());
            }

            return response()->json($response->json() ?? []);
        } catch (\Throwable $e) {
            Log::error('Social webhook call failed', ['path' => $path, 'error' => $e->getMessage()]);

            return response()->json(['error' => 'Upstream unreachable'], 502);
        }
    }

    /** Fixture variant copies used when no Cerebras key is set. */
    private function stubCopies(string $service, int $count): array
    {
        $copies = [];
        for ($i = 0; $i < $count; $i++) {
            $copies[] = [
                'headline' => $this->stubHeadline($service),
                'body' => $this->stubBody($service),
                'cta' => $this->stubCta($service),
                'hashtags' => ['epathways', 'studyinnz', 'newzealand'],
            ];
        }

        return $copies;
    }

    private function stubHeadline(string $service): string
    {
        return match ($service) {
            'education' => 'Your NZ degree, mapped out in 10 minutes',
            'immigration' => 'The smartest path to your NZ resident visa',
            'accommodation' => 'A safe NZ landing, sorted before you fly',
            default => 'Your New Zealand journey, simplified',
        };
    }

    private function stubBody(string $service): string
    {
        return match ($service) {
            'education' => 'Skip the trial-and-error. We match your goals to a real-world programme, sort intake timing, and walk you through every form. Free first assessment.',
            'immigration' => 'Licensed advisers, no guesswork. We package your application so Immigration NZ sees exactly what they need — first time. Free eligibility check today.',
            'accommodation' => 'From airport pickup to first-night accommodation to long-term flats — handled by people who landed here themselves. Built for new arrivals.',
            default => 'Real guidance from people who have been through it. Every step, every form, every interview.',
        };
    }

    private function stubCta(string $service): string
    {
        return match ($service) {
            'education' => 'Take the free assessment',
            'immigration' => 'Check my eligibility',
            'accommodation' => 'Plan my arrival',
            default => 'Get started',
        };
    }
}
