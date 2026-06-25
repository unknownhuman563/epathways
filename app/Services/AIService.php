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
            'model'       => $model,
            'messages'    => $messages,
            'max_tokens'  => (int) config('ai.max_tokens', 1500),
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
                    'body'   => mb_substr($response->body(), 0, 500),
                ]);

                return $this->emptyEnvelope($model);
            }

            $data = $response->json();

            return [
                'content' => data_get($data, 'choices.0.message.content'),
                'tokens'  => data_get($data, 'usage.total_tokens'),
                'model'   => data_get($data, 'model', $model),
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
            . "\n\nYou are assisting {$user->name} (role: {$user->role}). {$scope}";
    }

    private function roleScopeDescription(User $user): string
    {
        return match ($user->role) {
            User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN => 'They are an administrator with visibility across every department (sales, education, immigration, English, accommodation).',
            'sales'         => 'They work in Sales and focus on leads still in the sales pipeline (not yet converted).',
            'education'     => 'They work in Education advising and focus on enrolled students.',
            'english'       => 'They work in English language training and focus on English students.',
            'immigration', User::ROLE_IMMIGRATION_MANAGER, User::ROLE_IMMIGRATION_ADVISER => 'They work in Immigration consulting and focus on immigration cases.',
            'accommodation' => 'They work in Accommodation and focus on accommodation clients.',
            default         => 'Keep guidance general and remind them you cannot see records outside their remit.',
        };
    }

    private function post(array $payload)
    {
        return Http::withHeaders([
            'Authorization' => 'Bearer ' . config('ai.api_key'),
            'Content-Type'  => 'application/json',
            // OpenRouter attribution headers (optional but recommended).
            'HTTP-Referer'  => config('app.url'),
            'X-Title'       => 'ePathways CRM',
        ])
            ->timeout((int) config('ai.timeout_seconds', 30))
            ->post(rtrim(config('ai.base_url'), '/') . '/chat/completions', $payload);
    }

    private function emptyEnvelope(string $model): array
    {
        return ['content' => null, 'tokens' => null, 'model' => $model];
    }
}
