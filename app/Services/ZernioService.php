<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Thin client for the Zernio unified social API (https://zernio.com/api/v1).
 * Bearer-authenticated with the sk_… key from config('services.zernio'). Each
 * method returns plain arrays already shaped for the Social MVP frontend, so
 * AiAdsWebhookController can swap its stubs for real Zernio calls when the key
 * is set. Endpoint paths are taken from the official SDK's API reference.
 */
class ZernioService
{
    public function configured(): bool
    {
        return ! empty(config('services.zernio.api_key'));
    }

    private function client(): PendingRequest
    {
        return Http::withToken(config('services.zernio.api_key'))
            ->baseUrl(rtrim((string) config('services.zernio.base_url'), '/'))
            ->acceptJson()
            ->timeout(30);
    }

    /** GET /accounts → [{id, platform, handle, status, last_post_at}]. */
    public function listAccounts(): array
    {
        $res = $this->client()->get('/accounts')->throw();
        $rows = $res->json('data') ?? $res->json('accounts') ?? $res->json() ?? [];

        return ['accounts' => array_values(array_map(fn ($a) => [
            'id' => $a['_id'] ?? $a['id'] ?? null,
            'platform' => $a['platform'] ?? null,
            'handle' => $a['username'] ?? $a['handle'] ?? $a['name'] ?? ($a['displayName'] ?? ''),
            'status' => $a['status'] ?? 'active',
            'last_post_at' => $a['lastPostAt'] ?? $a['last_post_at'] ?? null,
        ], is_array($rows) ? $rows : []))];
    }

    /** Map requested platform slugs to Zernio {platform, accountId} targets. */
    public function platformTargets(array $platforms): array
    {
        $byPlatform = [];
        foreach ($this->listAccounts()['accounts'] as $a) {
            if (! empty($a['platform']) && ! empty($a['id'])) {
                $byPlatform[strtolower($a['platform'])] = $a['id'];
            }
        }

        $targets = [];
        foreach ($platforms as $p) {
            $key = strtolower($p);
            if (isset($byPlatform[$key])) {
                $targets[] = ['platform' => $key, 'accountId' => $byPlatform[$key]];
            }
        }

        return $targets;
    }

    /**
     * POST /posts — publish now (no schedule) or schedule for a future time.
     * $targets is the [{platform, accountId}] array from platformTargets().
     */
    public function createPost(string $content, array $targets, ?string $scheduledFor = null, ?string $timezone = null, array $mediaItems = []): array
    {
        $body = ['content' => $content, 'platforms' => $targets];
        if (! empty($mediaItems)) {
            $body['mediaItems'] = array_values($mediaItems);
        }
        if ($scheduledFor) {
            $body['scheduledFor'] = $scheduledFor;
            $body['timezone'] = $timezone ?: (string) config('app.timezone', 'UTC');
        } else {
            $body['publishNow'] = true;
        }

        $res = $this->client()->post('/posts', $body)->throw();
        $post = $res->json('post') ?? $res->json() ?? [];

        return ['ok' => true, 'post_id' => $post['_id'] ?? $post['id'] ?? null];
    }

    /**
     * POST /media/upload-direct — upload a file to Zernio and return a MediaItem
     * ({url, type, filename, mimeType, size}) ready to drop into a post's
     * mediaItems. The returned URL is publicly reachable over HTTPS.
     */
    public function uploadMedia(\Illuminate\Http\UploadedFile $file): array
    {
        $res = $this->client()
            ->timeout(120)
            ->attach('file', file_get_contents($file->getRealPath()), $file->getClientOriginalName())
            ->post('/media/upload-direct')
            ->throw();

        $m = $res->json();
        $mime = (string) ($m['contentType'] ?? $file->getMimeType() ?? '');

        return array_filter([
            'url' => (string) ($m['url'] ?? ''),
            'type' => str_starts_with($mime, 'video') ? 'video' : (str_starts_with($mime, 'image') ? 'image' : null),
            'filename' => $m['filename'] ?? $file->getClientOriginalName(),
            'mimeType' => $mime ?: null,
            'size' => $m['size'] ?? null,
        ], fn ($v) => $v !== null && $v !== '');
    }

    /** GET /posts → [{id, platform, headline, schedule_at, status, campaign_name}]. */
    public function listPosts(array $query = []): array
    {
        $res = $this->client()->get('/posts', $query)->throw();
        $rows = $res->json('data') ?? $res->json('posts') ?? $res->json() ?? [];

        return array_values(array_map(fn ($p) => [
            'id' => $p['_id'] ?? $p['id'] ?? null,
            'platform' => $p['platforms'][0]['platform'] ?? ($p['platform'] ?? null),
            'headline' => Str::limit((string) ($p['content'] ?? ''), 80),
            'schedule_at' => $p['scheduledFor'] ?? $p['scheduledAt'] ?? $p['schedule_at'] ?? null,
            'status' => $p['status'] ?? null,
            'campaign_name' => $p['campaignName'] ?? $p['campaign_name'] ?? null,
            'service' => null,
        ], is_array($rows) ? $rows : []));
    }

    /**
     * GET /posts?status=published — published posts available to boost. Returns
     * the full content (for AI targeting) plus a short preview and the post's
     * platform, so the boost picker can fill the form on selection.
     */
    public function publishedPosts(): array
    {
        $res = $this->client()->get('/posts', ['status' => 'published', 'limit' => 50])->throw();
        $rows = $res->json('data') ?? $res->json('posts') ?? $res->json() ?? [];

        return ['posts' => array_values(array_map(function ($p) {
            $content = (string) ($p['content'] ?? '');
            $pf = $p['platforms'][0] ?? [];

            return [
                'id' => (string) ($p['_id'] ?? $p['id'] ?? ''),
                'platform' => $pf['platform'] ?? ($p['platform'] ?? null),
                'account_id' => (string) ($pf['accountId'] ?? $p['accountId'] ?? ''),
                'account' => (string) ($pf['accountName'] ?? $pf['username'] ?? $pf['handle'] ?? $p['accountName'] ?? ''),
                'content' => $content,
                'preview' => Str::limit($content, 60) ?: '(no caption)',
                'published_at' => $p['publishedAt'] ?? $p['publishedFor'] ?? $p['createdAt'] ?? null,
            ];
        }, is_array($rows) ? $rows : []))];
    }

    /** PUT /posts/{id} — used to reschedule. */
    public function updatePost(string $postId, array $body): array
    {
        $this->client()->put('/posts/'.$postId, $body)->throw();

        return ['ok' => true];
    }

    /** DELETE /posts/{id} — cancel a scheduled post. */
    public function deletePost(string $postId): array
    {
        $this->client()->delete('/posts/'.$postId)->throw();

        return ['ok' => true];
    }

    /** GET /connect/{platform} → OAuth URL to connect a new account. */
    public function connectUrl(string $platform): array
    {
        $res = $this->client()->get('/connect/'.$platform)->throw();

        return ['url' => $res->json('url') ?? $res->json('connectUrl') ?? $res->json('authUrl')];
    }

    /** DELETE /accounts/{id} — disconnect a connected account. */
    public function disconnect(string $accountId): array
    {
        $this->client()->delete('/accounts/'.$accountId)->throw();

        return ['ok' => true];
    }

    // ─── Inbox: conversations + messages ──────────────────────────────────

    /** GET /inbox/conversations → [{id, account_id, platform, name, snippet, unread, updated_at}]. */
    public function listConversations(array $query = []): array
    {
        $res = $this->client()->get('/inbox/conversations', $query)->throw();
        $rows = $res->json('data') ?? $res->json('conversations') ?? $res->json() ?? [];

        return ['conversations' => array_values(array_map(function ($c) {
            $last = $c['lastMessage'] ?? '';

            return [
                'id' => $c['id'] ?? $c['_id'] ?? null,
                'account_id' => $c['accountId'] ?? null,
                'platform' => $c['platform'] ?? null,
                'name' => $c['participantName'] ?? $c['name'] ?? 'Unknown',
                'snippet' => Str::limit((string) (is_array($last) ? ($last['text'] ?? '') : $last), 80),
                'unread' => (int) ($c['unreadCount'] ?? 0),
                'updated_at' => $c['updatedTime'] ?? $c['updatedAt'] ?? null,
            ];
        }, is_array($rows) ? $rows : []))];
    }

    /** GET /inbox/conversations/{id}/messages?accountId= → [{id, direction, text, at}]. */
    public function conversationMessages(string $conversationId, string $accountId): array
    {
        $res = $this->client()->get('/inbox/conversations/'.$conversationId.'/messages', ['accountId' => $accountId])->throw();
        $rows = $res->json('data') ?? $res->json('messages') ?? [];

        return ['messages' => array_values(array_map(fn ($m) => [
            'id' => $m['id'] ?? $m['_id'] ?? null,
            'direction' => (($m['direction'] ?? '') === 'outgoing') ? 'out' : 'in',
            'text' => $m['message'] ?? $m['text'] ?? $m['content'] ?? '',
            'at' => $m['createdAt'] ?? $m['sentAt'] ?? null,
        ], is_array($rows) ? $rows : []))];
    }

    /** POST /inbox/conversations/{id}/messages — send a reply (accountId required). */
    public function sendMessage(string $conversationId, string $accountId, string $text): array
    {
        $this->client()
            ->post('/inbox/conversations/'.$conversationId.'/messages?accountId='.urlencode($accountId), [
                'accountId' => $accountId,
                'message' => $text,
            ])->throw();

        return ['ok' => true];
    }

    /** POST /inbox/conversations/{id}/read — mark a conversation read (clears unread). */
    public function markRead(string $conversationId, string $accountId): array
    {
        $this->client()
            ->post('/inbox/conversations/'.$conversationId.'/read?accountId='.urlencode($accountId), [
                'accountId' => $accountId,
            ])->throw();

        return ['ok' => true];
    }

    /**
     * GET /inbox/comments → posts that have comments (account_id needed to
     * drill into / reply to a post's comments).
     */
    public function listComments(array $query = []): array
    {
        $res = $this->client()->get('/inbox/comments', $query)->throw();
        $rows = $res->json('data') ?? $res->json('comments') ?? $res->json() ?? [];

        return ['comments' => array_values(array_map(fn ($c) => [
            'id' => $c['id'] ?? null,
            'post_id' => $c['id'] ?? null,
            'account_id' => $c['accountId'] ?? null,
            'platform' => $c['platform'] ?? null,
            'content' => Str::limit((string) ($c['content'] ?? ''), 160),
            'comment_count' => (int) ($c['commentCount'] ?? 0),
            'permalink' => $c['permalink'] ?? null,
            'at' => $c['createdTime'] ?? $c['createdAt'] ?? null,
        ], is_array($rows) ? $rows : []))];
    }

    /** POST /inbox/comments/{postId} — add a reply comment on a post (accountId required). */
    public function replyComment(string $postId, string $accountId, string $text): array
    {
        $this->client()
            ->post('/inbox/comments/'.$postId.'?accountId='.urlencode($accountId), [
                'accountId' => $accountId,
                'message' => $text,
            ])->throw();

        return ['ok' => true];
    }

    // ─── Ads ──────────────────────────────────────────────────────────────

    /** GET /ads → [{id, name, platform, status, objective}]. */
    public function listAds(array $query = []): array
    {
        $res = $this->client()->get('/ads', $query)->throw();
        $rows = $res->json('data') ?? $res->json('ads') ?? $res->json() ?? [];

        return ['ads' => array_values(array_map(fn ($a) => [
            'id' => $a['_id'] ?? $a['id'] ?? null,
            'name' => $a['name'] ?? '—',
            'platform' => $a['platform'] ?? null,
            'status' => $a['status'] ?? null,
            'objective' => $a['goal'] ?? $a['objective'] ?? null,
        ], is_array($rows) ? $rows : []))];
    }

    /** GET /ads/accounts → connected ad accounts (for boost targeting). */
    public function listAdAccounts(): array
    {
        // GET /ads/accounts requires the SOCIAL accountId (ad accounts are scoped
        // per connected account), so walk every account and collect its ad
        // accounts, tagging each with the social accountId + platform it hangs
        // off. Page-only connections that can't list ad accounts (422) are skipped.
        $adAccounts = [];

        foreach ($this->listAccounts()['accounts'] as $acct) {
            $accountId = $acct['id'] ?? null;
            if (! $accountId) {
                continue;
            }

            try {
                $res = $this->client()->get('/ads/accounts', ['accountId' => $accountId])->throw();
                $rows = $res->json('accounts') ?? $res->json('data') ?? [];
                foreach (is_array($rows) ? $rows : [] as $a) {
                    $id = $a['id'] ?? $a['_id'] ?? null;
                    if (! $id) {
                        continue;
                    }
                    $adAccounts[] = [
                        'id' => (string) $id,                  // platform ad account id (act_…)
                        'name' => $a['name'] ?? $a['adAccountName'] ?? '—',
                        'platform' => $acct['platform'] ?? null,
                        'accountId' => (string) $accountId,     // the social account it hangs off
                        'currency' => $a['currency'] ?? null,
                    ];
                }
            } catch (\Throwable $e) {
                // This account can't list ad accounts (page-only / no ads) — skip it.
            }
        }

        return ['adAccounts' => $adAccounts];
    }

    /** POST /ads/boost — turn a published post into a paid campaign. */
    public function boostPost(array $payload): array
    {
        $res = $this->client()->post('/ads/boost', $payload)->throw();
        $ad = $res->json('ad') ?? $res->json() ?? [];

        return ['ok' => true, 'ad_id' => $ad['_id'] ?? $ad['id'] ?? null];
    }

    /** GET /ads/{id}/analytics → {spend, impressions, clicks, ctr, cpc, cpm}. */
    public function adAnalytics(string $adId): array
    {
        $res = $this->client()->get('/ads/'.$adId.'/analytics')->throw();
        $a = $res->json('data') ?? $res->json() ?? [];

        return [
            'spend' => $a['spend'] ?? 0,
            'impressions' => $a['impressions'] ?? 0,
            'clicks' => $a['clicks'] ?? 0,
            'ctr' => $a['ctr'] ?? 0,
            'cpc' => $a['cpc'] ?? 0,
            'cpm' => $a['cpm'] ?? 0,
        ];
    }

    /**
     * GET /ads/targeting/search — resolve a human query into a platform's
     * targeting ids. dimension: interest|geo|behavior|income. For geo pass
     * geoType (country|region|city|…). Returns [{id, name, type, path, size}].
     */
    public function searchTargeting(string $accountId, string $q, string $dimension = 'interest', array $opts = []): array
    {
        $query = array_filter([
            'accountId' => $accountId,
            'q' => $q,
            'dimension' => $dimension,
            'geoType' => $opts['geoType'] ?? null,
            'countryCode' => $opts['countryCode'] ?? null,
            'limit' => $opts['limit'] ?? 20,
        ], fn ($v) => $v !== null && $v !== '');

        $res = $this->client()->get('/ads/targeting/search', $query)->throw();
        $rows = $res->json('data') ?? $res->json() ?? [];

        return ['results' => array_values(array_map(fn ($r) => [
            'id' => (string) ($r['id'] ?? ''),
            'name' => (string) ($r['name'] ?? ''),
            'type' => $r['type'] ?? $dimension,
            'path' => array_values((array) ($r['path'] ?? [])),
            'size' => $r['audienceSize'] ?? null,
        ], is_array($rows) ? $rows : []))];
    }

    /** GET /ads/audiences?type=saved_targeting — stored targeting presets. */
    public function listSavedAudiences(string $accountId, string $adAccountId, ?string $platform = null): array
    {
        $res = $this->client()->get('/ads/audiences', array_filter([
            'accountId' => $accountId,
            'adAccountId' => $adAccountId,
            'platform' => $platform,
            'type' => 'saved_targeting',
        ], fn ($v) => $v !== null && $v !== ''))->throw();
        $rows = $res->json('data') ?? $res->json('audiences') ?? $res->json() ?? [];

        return ['presets' => array_values(array_map(fn ($a) => [
            'id' => (string) ($a['id'] ?? $a['platformAudienceId'] ?? ''),
            'name' => (string) ($a['name'] ?? '—'),
            'spec' => $a['spec'] ?? null,
        ], is_array($rows) ? $rows : []))];
    }

    /** POST /ads/audiences — store a reusable targeting spec (a preset). */
    public function createSavedAudience(string $accountId, string $name, array $spec): array
    {
        $res = $this->client()->post('/ads/audiences', [
            'type' => 'saved_targeting',
            'accountId' => $accountId,
            'name' => $name,
            'spec' => $spec,
        ])->throw();
        $a = $res->json('audience') ?? $res->json() ?? [];

        return ['ok' => true, 'id' => $a['id'] ?? $a['_id'] ?? null, 'name' => $a['name'] ?? $name];
    }

    // ─── Analytics / Performance (Phase 2b) ───────────────────────────────

    /**
     * GET /analytics → per-post metrics, aggregated into {posts, totals}.
     * Accepts fromDate/toDate (YYYY-MM-DD), platform, sortBy, order, limit.
     */
    public function analytics(array $query = []): array
    {
        $res = $this->client()->get('/analytics', $query)->throw();
        $json = $res->json();
        // The endpoint returns a list under data/posts, or a single post object.
        $rows = $res->json('data') ?? $res->json('posts')
            ?? (isset($json['postId']) ? [$json] : (is_array($json) ? $json : []));

        $posts = array_values(array_map(function ($p) {
            $a = $p['analytics'] ?? $p;

            return [
                'post_id' => $p['postId'] ?? $p['_id'] ?? null,
                'content' => Str::limit((string) ($p['content'] ?? ''), 70),
                'platform' => $p['platform'] ?? ($p['platformAnalytics'][0]['platform'] ?? null),
                'published_at' => $p['publishedAt'] ?? $p['scheduledFor'] ?? null,
                'impressions' => (int) ($a['impressions'] ?? 0),
                'reach' => (int) ($a['reach'] ?? 0),
                'likes' => (int) ($a['likes'] ?? 0),
                'comments' => (int) ($a['comments'] ?? 0),
                'shares' => (int) ($a['shares'] ?? 0),
                'clicks' => (int) ($a['clicks'] ?? 0),
                'engagement_rate' => round((float) ($a['engagementRate'] ?? 0), 2),
            ];
        }, is_array($rows) ? $rows : []));

        $sum = fn ($k) => array_sum(array_column($posts, $k));

        return [
            'posts' => $posts,
            'totals' => [
                'impressions' => $sum('impressions'),
                'reach' => $sum('reach'),
                'engagement' => $sum('likes') + $sum('comments') + $sum('shares'),
                'clicks' => $sum('clicks'),
                'posts' => count($posts),
            ],
        ];
    }
}
