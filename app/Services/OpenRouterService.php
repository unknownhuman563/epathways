<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Thin OpenAI-compatible client for OpenRouter (https://openrouter.ai). The key
 * lives in .env and is read via config('services.openrouter.*') — never inline.
 * Reusable across surfaces; the first caller is the immigration assessment
 * completeness review (AssessmentReviewService).
 */
class OpenRouterService
{
    private string $apiKey;

    private string $baseUrl;

    private string $model;

    public function __construct()
    {
        $this->apiKey = (string) config('services.openrouter.api_key');
        $this->baseUrl = rtrim((string) config('services.openrouter.base_url', 'https://openrouter.ai/api/v1'), '/');
        $this->model = (string) config('services.openrouter.model', 'openai/gpt-4o-mini');
    }

    /** Whether a key is configured — callers degrade gracefully when false. */
    public function configured(): bool
    {
        return $this->apiKey !== '';
    }

    /**
     * Run a chat completion. Returns the assistant message text.
     *
     * @param  array<int, array{role: string, content: string}>  $messages
     * @param  array{model?: string, temperature?: float, max_tokens?: int}  $opts
     */
    public function chat(array $messages, array $opts = []): string
    {
        if (! $this->configured()) {
            throw new \RuntimeException('OpenRouter API key is not configured. Add OPENROUTER_API_KEY to .env.');
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$this->apiKey,
            'Content-Type' => 'application/json',
            // OpenRouter attribution headers (optional but recommended).
            'HTTP-Referer' => (string) config('app.url', 'https://epathways.co.nz'),
            'X-Title' => 'ePathways',
        ])->timeout($opts['timeout'] ?? 60)->post("{$this->baseUrl}/chat/completions", [
            'model' => $opts['model'] ?? $this->model,
            'messages' => $messages,
            'temperature' => $opts['temperature'] ?? 0.2,
            'max_tokens' => $opts['max_tokens'] ?? 1200,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('OpenRouter request failed ('.$response->status().'): '.$response->body());
        }

        return (string) $response->json('choices.0.message.content', '');
    }

    /** The model id this client will use (for stamping stored results). */
    public function model(): string
    {
        return $this->model;
    }

    /**
     * Pull a JSON object out of a model reply that may wrap it in prose or a
     * fenced code block. Returns the raw JSON string (caller decodes).
     */
    public function extractJson(string $content): string
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
}
