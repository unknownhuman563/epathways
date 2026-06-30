<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper over the OpenRouter chat-completions API. Every call is
 * defensive: if AI is disabled or OpenRouter is unreachable, the CRM keeps
 * working — chat() returns a null-content envelope rather than throwing.
 *
 * Read all knobs from config('ai.*') (never env() — config is cached in
 * deployed envs). The tenant kill switch lives in the DB (Setting); the
 * config flag is the hard kill switch. Both must be true to call out.
 */
class AIService
{
    /**
     * Send a chat-completions request. Returns a stable envelope:
     *   ['content' => ?string, 'tokens' => ?int, 'model' => string]
     * content is null on any failure (caller decides the fallback copy).
     */
    public function chat(array $messages, ?string $model = null): array
    {
        $model = $model ?: config('ai.default_model');

        $payload = [
            'model' => $model,
            'messages' => $messages,
            'max_tokens' => (int) config('ai.max_tokens', 1500),
            'temperature' => (float) config('ai.temperature', 0.7),
        ];

        try {
            $response = $this->post($payload);

            // Jittered single retry on transient 5xx.
            if ($response->serverError()) {
                usleep(random_int(150, 400) * 1000);
                $response = $this->post($payload);
            }

            if (! $response->successful()) {
                Log::warning('AIService: OpenRouter request failed', [
                    'status' => $response->status(),
                    'body' => mb_substr($response->body(), 0, 500),
                ]);

                return $this->emptyEnvelope($model);
            }

            $data = $response->json();

            return [
                'content' => data_get($data, 'choices.0.message.content'),
                'tokens' => data_get($data, 'usage.total_tokens'),
                'model' => data_get($data, 'model', $model),
            ];
        } catch (\Throwable $e) {
            // Network timeout, DNS failure, malformed response, etc. Never
            // let an AI hiccup bubble up into the request lifecycle.
            Log::warning('AIService: OpenRouter call threw', ['message' => $e->getMessage()]);

            return $this->emptyEnvelope($model);
        }
    }

    /** Both the config kill switch and the tenant toggle must be on. */
    public function isEnabled(): bool
    {
        return (bool) config('ai.enabled') && (bool) Setting::get('ai_enabled', true);
    }

    /**
     * The canonical ePathways assistant voice (config) plus a one-line role
     * context so the model knows whom it's helping and what they can see.
     */
    public function getSystemPrompt(User $user): string
    {
        $scope = $this->roleScopeDescription($user);

        return trim(config('ai.system_prompt'))
            ."\n\nYou are assisting {$user->name} (role: {$user->role}). {$scope}";
    }

    /** Whether an OpenRouter key is configured (else AI features are off). */
    public function configured(): bool
    {
        return ! empty(config('ai.api_key'));
    }

    /**
     * Write one ad creative (primary text + headline) from a short brief.
     * Returns ['headline' => string, 'body' => string]; empty strings on failure.
     */
    public function generateAdCreative(string $brief, string $platform = 'facebook'): array
    {
        $system = <<<'PROMPT'
        You are a senior paid-social copywriter for ePathways, a New Zealand education & immigration consultancy. Write ONE high-performing ad creative for the given platform and brief.

        Voice: warm, credible, specific. Real value props (free assessment, licensed immigration advisers, NZQA-recognised programmes, end-to-end support). No fake urgency. Tasteful emoji okay.

        CRITICAL: Respond with ONLY a single valid JSON object. No markdown, no code fences, no preamble.
        Shape: { "headline": "short scroll-stopping headline, max ~40 chars", "body": "the primary text, 1-3 short sentences" }
        PROMPT;

        $res = $this->chat([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => "Platform: {$platform}\nBrief: {$brief}"],
        ]);

        $parsed = json_decode($this->extractJson((string) ($res['content'] ?? '')), true) ?: [];

        return [
            'headline' => (string) ($parsed['headline'] ?? ''),
            'body' => (string) ($parsed['body'] ?? ''),
        ];
    }

    /**
     * Suggest paid-ad audience targeting from a post/brief: age range, ISO
     * country codes, interest keyword names and a one-line rationale.
     */
    public function suggestAdTargeting(array $brief): array
    {
        $system = <<<'PROMPT'
        You are a paid-social media buyer for ePathways, a New Zealand education & immigration consultancy. Given an ad's goal, platform and post content, propose the best paid-ad AUDIENCE.

        Context: ePathways helps international students and migrants move to New Zealand to study and settle. Typical prospects are 18-40, in source markets like India, the Philippines, Nepal, Sri Lanka, Vietnam, Pakistan and Bangladesh, plus onshore audiences already in New Zealand. Interests skew to study abroad, overseas education, student visas, IELTS/PTE, immigration, working in New Zealand, and fields like nursing, IT, business and trades.

        CRITICAL: Respond with ONLY a single valid JSON object. No markdown, no code fences, no preamble.
        Shape:
        { "age_min": 18, "age_max": 40, "countries": ["IN", "PH", "NP"], "interests": ["Studying abroad", "International student", "Higher education", "Immigration"], "rationale": "One short sentence on who and why." }

        Rules:
        - countries = 2-6 ISO 3166-1 alpha-2 codes.
        - interests = 4-8 BROAD, well-known interest names that an ad platform's targeting taxonomy actually contains — single concepts like "Studying abroad", "International student", "Higher education", "Universities", "Immigration", "Travel", "English language". DO NOT use long specific phrases such as "Immigration to New Zealand" or "Study in New Zealand" — those never match. No hashtags.
        - keep ages 13-65 and age_min <= age_max.
        PROMPT;

        $res = $this->chat([
            ['role' => 'system', 'content' => $system],
            ['role' => 'user', 'content' => 'Suggest the audience for this ad:'."\n\n".json_encode([
                'goal' => $brief['goal'] ?? 'traffic',
                'platform' => $brief['platform'] ?? 'facebook',
                'post_content' => mb_substr((string) ($brief['content'] ?? ''), 0, 1200),
            ])],
        ]);

        $parsed = json_decode($this->extractJson((string) ($res['content'] ?? '')), true) ?: [];
        $ageMin = (int) ($parsed['age_min'] ?? 18);
        $ageMax = (int) ($parsed['age_max'] ?? 45);

        return [
            'ageMin' => max(13, min(65, $ageMin)),
            'ageMax' => max(13, min(65, max($ageMin, $ageMax))),
            'countries' => array_values(array_filter(array_map(fn ($c) => strtoupper(substr((string) $c, 0, 2)), (array) ($parsed['countries'] ?? [])))),
            'interests' => array_values(array_filter(array_map(fn ($i) => trim((string) $i), (array) ($parsed['interests'] ?? [])))),
            'rationale' => (string) ($parsed['rationale'] ?? ''),
        ];
    }

    /** Pull the first JSON object out of a model response (tolerates fences/prose). */
    private function extractJson(string $content): string
    {
        $trimmed = trim($content);
        if (preg_match('/```(?:json)?\s*(.+?)\s*```/s', $trimmed, $m)) {
            return trim($m[1]);
        }
        $start = strpos($trimmed, '{');
        $end = strrpos($trimmed, '}');
        if ($start !== false && $end !== false && $end > $start) {
            return substr($trimmed, $start, $end - $start + 1);
        }

        return $trimmed;
    }

    private function roleScopeDescription(User $user): string
    {
        return match ($user->role) {
            User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN => 'They are an administrator with visibility across every department (sales, education, immigration, English, accommodation).',
            'sales' => 'They work in Sales and focus on leads still in the sales pipeline (not yet converted).',
            'education' => 'They work in Education advising and focus on enrolled students.',
            'english' => 'They work in English language training and focus on English students.',
            'immigration', User::ROLE_IMMIGRATION_MANAGER, User::ROLE_IMMIGRATION_ADVISER => 'They work in Immigration consulting and focus on immigration cases.',
            'accommodation' => 'They work in Accommodation and focus on accommodation clients.',
            default => 'Keep guidance general and remind them you cannot see records outside their remit.',
        };
    }

    private function post(array $payload)
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer '.config('ai.api_key'),
            'Content-Type' => 'application/json',
            // OpenRouter attribution headers (optional but recommended).
            'HTTP-Referer' => config('app.url'),
            'X-Title' => 'ePathways CRM',
        ])
            ->timeout((int) config('ai.timeout_seconds', 30))
            ->post(rtrim(config('ai.base_url'), '/').'/chat/completions', $payload);
    }

    private function emptyEnvelope(string $model): array
    {
        return ['content' => null, 'tokens' => null, 'model' => $model];
    }
}
