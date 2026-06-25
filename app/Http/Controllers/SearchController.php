<?php

namespace App\Http\Controllers;

use App\Services\SearchService;
use Illuminate\Http\Request;

/**
 * Global search endpoint — returns role-gated, grouped results for the
 * Cmd+K search bar. JSON only; the actual querying lives in SearchService.
 */
class SearchController extends Controller
{
    public function search(Request $request, SearchService $service)
    {
        $validated = $request->validate([
            'q' => 'required|string|min:' . SearchService::MIN_QUERY . '|max:100',
        ]);

        return response()->json([
            'query'  => $validated['q'],
            'groups' => $service->search($validated['q'], $request->user()),
        ]);
    }
}
