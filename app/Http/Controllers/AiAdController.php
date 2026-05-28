<?php

namespace App\Http\Controllers;

use App\Services\CerebrasService;
use App\Services\PlaiService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AiAdController extends Controller
{
    public function index()
    {
        $plai = PlaiService::fromConfig();

        return Inertia::render('admin/AiAds', [
            'plaiConfigured' => $plai->isConfigured(),
            'plaiWorkspaceId' => $plai->workspaceId(),
        ]);
    }

    /** Lightweight probe — calls GET /public/workspace to confirm the key works. */
    public function testConnection()
    {
        $plai = PlaiService::fromConfig();

        if (!$plai->isConfigured()) {
            return response()->json([
                'ok' => false,
                'reason' => 'PLAI_API_KEY not set. Add it to .env (see docs.plai.io/quickstart) and run `php artisan config:clear`.',
            ], 200);
        }

        try {
            $workspaces = $plai->listWorkspaces();

            return response()->json([
                'ok' => true,
                'workspaces' => $workspaces,
            ]);
        } catch (\Throwable $e) {
            Log::warning('PLAI connection probe failed', ['error' => $e->getMessage()]);
            return response()->json([
                'ok' => false,
                'reason' => $e->getMessage(),
            ], 200);
        }
    }

    /**
     * Local copy brainstorming via Cerebras — produces draft ad copy from a
     * brief WITHOUT hitting PLAI. Useful for iterating on creative before
     * paying for a real campaign launch.
     */
    public function generateCopy(Request $request, CerebrasService $cerebras)
    {
        $data = $request->validate([
            'ad_type'       => 'required|in:social,email',
            'platform'      => 'nullable|string|max:60',
            'topic'         => 'required|string|max:300',
            'product'       => 'nullable|string|max:200',
            'audience'      => 'nullable|string|max:400',
            'tone'          => 'nullable|string|max:100',
            'key_points'    => 'nullable|string|max:1500',
            'cta'           => 'nullable|string|max:200',
            'language'      => 'nullable|string|max:60',
            'variant_count' => 'nullable|integer|min:1|max:5',
        ]);

        try {
            return response()->json($cerebras->generateAdCopy($data));
        } catch (\Throwable $e) {
            Log::error('AI ad copy generation failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Generation failed. Please try again.'], 500);
        }
    }

    /**
     * Hand off a finalised brief to PLAI to actually launch the campaign.
     * The PlaiService::launchCampaign() stub will throw until we wire the
     * real schema — this controller surfaces that as a clear 501 to the UI.
     */
    public function launch(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:120',
            'platforms'   => 'required|array|min:1',
            'platforms.*' => 'string|in:facebook,instagram,google_search,google_display,youtube,tiktok,linkedin,snapchat,spotify,bing',
            'copy'        => 'required|string|max:2000',
            'cta'         => 'nullable|string|max:200',
            'event_id'    => 'nullable|integer|exists:events,id',
            'assets'      => 'nullable|array',
        ]);

        $plai = PlaiService::fromConfig();

        if (!$plai->isConfigured()) {
            return response()->json([
                'error' => 'PLAI not configured. Add PLAI_API_KEY to .env first.',
            ], 422);
        }

        try {
            $result = $plai->launchCampaign($data);
            return response()->json($result);
        } catch (\LogicException $e) {
            return response()->json([
                'error' => 'PLAI launch endpoint not yet wired. Once Enterprise access is approved, fill PlaiService::launchCampaign() using the swagger at partner.plai.io/api-docs/.',
            ], 501);
        } catch (\Throwable $e) {
            Log::error('PLAI campaign launch failed', ['error' => $e->getMessage()]);
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
