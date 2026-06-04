<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
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
    /** GET /webhook/social/stats */
    public function stats(Request $request)
    {
        return $this->forwardOrStub('GET', 'stats', null, fn () => [
            'activeCampaigns'     => 12,
            'pendingVariants'     => 47,
            'scheduledThisWeek'   => 23,
            'leadsThisWeek'       => 89,
            'deltas' => [
                'activeCampaigns'   => 3,
                'pendingVariants'   => -8,
                'scheduledThisWeek' => 5,
                'leadsThisWeek'     => 17,
            ],
        ]);
    }

    /** POST /webhook/social/generate-variants */
    public function generateVariants(Request $request)
    {
        $data = $request->validate([
            'campaign_name'    => 'required|string|max:160',
            'service'          => 'required|in:education,immigration,accommodation',
            'hook_angle'       => 'nullable|string|max:300',
            'target_audience'  => 'nullable|string|max:400',
            'platforms'        => 'required|array|min:1',
            'platforms.*'      => 'string|max:32',
            'variant_count'    => 'nullable|integer|min:1|max:10',
            'tone'             => 'nullable|in:friendly,professional,urgent,inspirational',
            // Optional reference asset uploaded as multipart. The Laravel
            // side just streams it through to n8n if configured; the stub
            // path ignores it.
            'reference'        => 'nullable|file|max:10240',
        ]);

        return $this->forwardOrStub('POST', 'generate-variants', $data, function () use ($data) {
            $count = max(1, min(10, (int) ($data['variant_count'] ?? 5)));
            $variants = [];
            foreach ($data['platforms'] as $platform) {
                for ($i = 0; $i < $count; $i++) {
                    $variants[] = $this->stubVariant($platform, $data['service'], $data['campaign_name']);
                }
            }
            return ['ok' => true, 'generated' => count($variants), 'variants' => $variants];
        });
    }

    /** GET /webhook/social/list-variants */
    public function listVariants(Request $request)
    {
        return $this->forwardOrStub('GET', 'list-variants', $request->query(), function () {
            $services = ['education', 'immigration', 'accommodation'];
            $platforms = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'];
            $variants = [];
            for ($i = 0; $i < 8; $i++) {
                $variants[] = $this->stubVariant(
                    $platforms[$i % count($platforms)],
                    $services[$i % count($services)],
                    'Sample Campaign #' . (($i % 3) + 1)
                );
            }
            return ['variants' => $variants];
        });
    }

    /** POST /webhook/social/update-variant */
    public function updateVariant(Request $request)
    {
        $data = $request->validate([
            'variantId' => 'required|string|max:64',
            'headline'  => 'required|string|max:200',
            'body'      => 'required|string|max:2000',
            'cta'       => 'required|string|max:120',
        ]);

        return $this->forwardOrStub('POST', 'update-variant', $data, fn () => ['ok' => true]);
    }

    /** POST /webhook/social/reject-variant */
    public function rejectVariant(Request $request)
    {
        $data = $request->validate([
            'variantId' => 'required|string|max:64',
        ]);

        return $this->forwardOrStub('POST', 'reject-variant', $data, fn () => ['ok' => true]);
    }

    /** POST /webhook/social/approve-variant */
    public function approveVariant(Request $request)
    {
        $data = $request->validate([
            'variantId'   => 'required|string|max:64',
            'scheduleAt'  => 'required|date',
            'platformIds' => 'nullable|array',
            'platformIds.*' => 'string|max:32',
        ]);

        return $this->forwardOrStub('POST', 'approve-variant', $data, fn () => ['ok' => true]);
    }

    /** GET /webhook/social/list-scheduled */
    public function listScheduled(Request $request)
    {
        $data = $request->validate([
            'from' => 'nullable|date',
            'to'   => 'nullable|date',
        ]);

        return $this->forwardOrStub('GET', 'list-scheduled', $data, function () {
            $services = ['education', 'immigration', 'accommodation'];
            $platforms = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube'];
            $posts = [];
            // Spread fixture posts across the current week so the calendar
            // looks populated in dev. Mix of past/future via day offsets.
            $base = now()->startOfWeek();
            for ($i = 0; $i < 12; $i++) {
                $posts[] = [
                    'id'             => 'p_' . Str::random(6),
                    'variant_id'     => 'v_' . Str::random(6),
                    'campaign_name'  => 'Sample Campaign #' . (($i % 3) + 1),
                    'service'        => $services[$i % count($services)],
                    'platform'       => $platforms[$i % count($platforms)],
                    'headline'       => $this->stubHeadline($services[$i % count($services)]),
                    'schedule_at'    => $base->copy()->addDays(($i * 2) % 7)->addHours(9 + ($i % 6))->toIso8601String(),
                ];
            }
            return ['posts' => $posts];
        });
    }

    /** POST /webhook/social/reschedule */
    public function reschedule(Request $request)
    {
        $data = $request->validate([
            'postId'         => 'required|string|max:64',
            'newScheduleAt'  => 'required|date',
        ]);

        return $this->forwardOrStub('POST', 'reschedule', $data, fn () => ['ok' => true]);
    }

    /** POST /webhook/social/cancel-post */
    public function cancelPost(Request $request)
    {
        $data = $request->validate([
            'postId' => 'required|string|max:64',
        ]);

        return $this->forwardOrStub('POST', 'cancel-post', $data, fn () => ['ok' => true]);
    }

    /** POST /webhook/social/quick-post */
    public function quickPost(Request $request)
    {
        $data = $request->validate([
            'text'         => 'required|string|max:2000',
            'platforms'    => 'required|array|min:1',
            'platforms.*'  => 'string|max:32',
            'media'        => 'nullable|file|max:10240',
            'schedule_at'  => 'nullable|date',
        ]);

        return $this->forwardOrStub('POST', 'quick-post', $data, fn () => [
            'ok'      => true,
            'post_id' => 'p_' . Str::random(8),
        ]);
    }

    /** GET /webhook/social/list-accounts */
    public function listAccounts(Request $request)
    {
        return $this->forwardOrStub('GET', 'list-accounts', null, fn () => [
            'accounts' => [
                [
                    'id'           => 'a_' . Str::random(6),
                    'platform'     => 'instagram',
                    'handle'       => '@epathways_nz',
                    'status'       => 'active',
                    'last_post_at' => now()->subDays(2)->toIso8601String(),
                ],
                [
                    'id'           => 'a_' . Str::random(6),
                    'platform'     => 'facebook',
                    'handle'       => '@epathwaysnz',
                    'status'       => 'active',
                    'last_post_at' => now()->subDays(2)->toIso8601String(),
                ],
                [
                    'id'           => 'a_' . Str::random(6),
                    'platform'     => 'tiktok',
                    'handle'       => '@epathways.nz',
                    'status'       => 'needs_reauth',
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

        return $this->forwardOrStub('POST', 'start-oauth', $data, fn () => [
            'url' => 'https://example.com/oauth/start?platform=' . $data['platform'],
        ]);
    }

    /** POST /webhook/social/disconnect */
    public function disconnectAccount(Request $request)
    {
        $data = $request->validate([
            'accountId' => 'required|string|max:64',
        ]);

        return $this->forwardOrStub('POST', 'disconnect', $data, fn () => ['ok' => true]);
    }

    // ── helpers ─────────────────────────────────────────────────────────

    /**
     * Forward to n8n if configured, otherwise return $stubFactory().
     * $payload is the JSON body for POSTs, query array for GETs.
     */
    private function forwardOrStub(string $method, string $path, $payload, callable $stubFactory)
    {
        $base = config('services.social.webhook_base');
        if (!$base) {
            return response()->json($stubFactory());
        }

        $url = rtrim($base, '/') . '/' . $path;
        $secret = config('services.social.webhook_secret');

        try {
            $request = Http::timeout(30);
            if ($secret) {
                $request = $request->withHeaders(['X-Webhook-Secret' => $secret]);
            }

            $response = $method === 'GET'
                ? $request->get($url, is_array($payload) ? $payload : [])
                : $request->post($url, is_array($payload) ? $payload : []);

            if (!$response->successful()) {
                Log::warning('Social webhook upstream error', [
                    'path' => $path, 'status' => $response->status(),
                ]);
                return response()->json(['error' => 'Upstream returned ' . $response->status()], $response->status());
            }

            return response()->json($response->json() ?? []);
        } catch (\Throwable $e) {
            Log::error('Social webhook call failed', ['path' => $path, 'error' => $e->getMessage()]);
            return response()->json(['error' => 'Upstream unreachable'], 502);
        }
    }

    private function stubVariant(string $platform, string $service, string $campaign): array
    {
        $models = ['claude', 'gpt', 'gemini'];
        return [
            'id'            => 'v_' . Str::random(8),
            'campaign_id'   => 'c_' . substr(md5($campaign), 0, 8),
            'campaign_name' => $campaign,
            'service'       => $service,
            'platform'      => $platform,
            'headline'      => $this->stubHeadline($service),
            'body'          => $this->stubBody($service),
            'cta'           => $this->stubCta($service),
            'thumbnail_url' => null,
            'model'         => $models[array_rand($models)],
            'created_at'    => now()->toIso8601String(),
        ];
    }

    private function stubHeadline(string $service): string
    {
        return match ($service) {
            'education'     => 'Your NZ degree, mapped out in 10 minutes',
            'immigration'   => 'The smartest path to your NZ resident visa',
            'accommodation' => 'A safe NZ landing, sorted before you fly',
            default         => 'Your New Zealand journey, simplified',
        };
    }

    private function stubBody(string $service): string
    {
        return match ($service) {
            'education'     => 'Skip the trial-and-error. We match your goals to a real-world programme, sort intake timing, and walk you through every form. Free first assessment.',
            'immigration'   => 'Licensed advisers, no guesswork. We package your application so Immigration NZ sees exactly what they need — first time. Free eligibility check today.',
            'accommodation' => 'From airport pickup to first-night accommodation to long-term flats — handled by people who landed here themselves. Built for new arrivals.',
            default         => 'Real guidance from people who have been through it. Every step, every form, every interview.',
        };
    }

    private function stubCta(string $service): string
    {
        return match ($service) {
            'education'     => 'Take the free assessment',
            'immigration'   => 'Check my eligibility',
            'accommodation' => 'Plan my arrival',
            default         => 'Get started',
        };
    }
}
