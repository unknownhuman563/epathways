<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin wrapper around the PLAI Partner API (https://partner.plai.io).
 *
 * Auth is a single `X-API-Key` header. Endpoints below were verified from
 * the public quickstart docs (docs.plai.io/quickstart). Campaign-launch
 * endpoints exist but their exact request schema lives behind PLAI's
 * authenticated Swagger UI — `launchCampaign()` is a deliberate stub that
 * we'll fill once an Enterprise key is available and the real schema is
 * visible.
 */
class PlaiService
{
    public function __construct(
        private readonly ?string $apiKey = null,
        private readonly ?string $baseUrl = null,
        private readonly ?string $workspaceId = null,
    ) {
    }

    public static function fromConfig(): self
    {
        return new self(
            apiKey: config('services.plai.api_key'),
            baseUrl: config('services.plai.base_url'),
            workspaceId: config('services.plai.workspace_id'),
        );
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->baseUrl);
    }

    public function workspaceId(): ?string
    {
        return $this->workspaceId;
    }

    /** GET /public/workspace — used as a connectivity / auth probe. */
    public function listWorkspaces(): array
    {
        return $this->get('/public/workspace');
    }

    public function getWorkspace(string $workspaceId): array
    {
        return $this->get("/public/workspace/{$workspaceId}");
    }

    /** GET /public/workspace/{id}/brand_context */
    public function getBrandContext(?string $workspaceId = null): array
    {
        $id = $workspaceId ?? $this->workspaceId;
        $this->requireWorkspace($id);

        return $this->get("/public/workspace/{$id}/brand_context");
    }

    /** POST /public/brand_context */
    public function setBrandContext(array $payload): array
    {
        return $this->post('/public/brand_context', $payload);
    }

    /** GET /public/workspace/{id}/creative_template */
    public function listCreativeTemplates(?string $workspaceId = null): array
    {
        $id = $workspaceId ?? $this->workspaceId;
        $this->requireWorkspace($id);

        return $this->get("/public/workspace/{$id}/creative_template");
    }

    public function getCreativeTemplate(string $templateId, ?string $workspaceId = null): array
    {
        $id = $workspaceId ?? $this->workspaceId;
        $this->requireWorkspace($id);

        return $this->get("/public/workspace/{$id}/creative_template/{$templateId}");
    }

    /** POST /public/creative_template */
    public function createCreativeTemplate(array $payload): array
    {
        return $this->post('/public/creative_template', $payload);
    }

    /**
     * Launch an ad campaign. PLAI's exact payload schema (recipients,
     * audience targeting, budget, schedule) is only visible inside their
     * authenticated Swagger UI at https://partner.plai.io/api-docs/.
     *
     * Until we have a real API key and can read that schema, this method
     * just throws so callers know it isn't wired yet. The HTTP plumbing
     * below is identical to the other methods — only the payload shape and
     * the exact endpoint path need confirming once access is granted.
     */
    public function launchCampaign(array $brief): array
    {
        throw new \LogicException(
            'PlaiService::launchCampaign() not yet wired — fill request body once ' .
            'PLAI Enterprise access is approved and the swagger schema is visible.'
        );
    }

    private function get(string $path): array
    {
        $response = $this->http()->get($this->url($path));

        return $this->handle($response, 'GET', $path);
    }

    private function post(string $path, array $body): array
    {
        $response = $this->http()->post($this->url($path), $body);

        return $this->handle($response, 'POST', $path);
    }

    private function http(): PendingRequest
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('PLAI API not configured — set PLAI_API_KEY in .env');
        }

        return Http::withHeaders([
            'X-API-Key'    => $this->apiKey,
            'Content-Type' => 'application/json',
            'Accept'       => 'application/json',
        ])->timeout(30);
    }

    private function url(string $path): string
    {
        return rtrim($this->baseUrl, '/') . $path;
    }

    private function handle($response, string $method, string $path): array
    {
        if (!$response->successful()) {
            Log::error('PLAI API error', [
                'method' => $method,
                'path'   => $path,
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \RuntimeException("PLAI {$method} {$path} failed: {$response->status()}");
        }

        return $response->json() ?? [];
    }

    private function requireWorkspace(?string $id): void
    {
        if (empty($id)) {
            throw new \RuntimeException('PLAI workspace id required — set PLAI_WORKSPACE_ID in .env or pass explicitly.');
        }
    }
}
