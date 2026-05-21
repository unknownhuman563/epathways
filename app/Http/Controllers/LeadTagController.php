<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadTag;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Free-form tags on leads. Sales types whatever — HOT, BUDGET, FAMILY,
 * DECISION-MAKER, etc. — and the system auto-creates the dictionary entry
 * on first use. Auto-suggest from existing tags happens client-side via
 * the props injected on the leads list page.
 */
class LeadTagController extends Controller
{
    /** Suggest existing tags by partial name match (client-side autocomplete feed). */
    public function index(Request $request)
    {
        try {
            $q = trim((string) $request->query('q', ''));

            $tags = LeadTag::orderBy('name')
                ->when($q !== '', fn ($qb) => $qb->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($q) . '%']))
                ->limit(20)
                ->get(['id', 'name', 'slug', 'color']);

            return response()->json($tags);
        } catch (\Throwable $e) {
            Log::error('Tag lookup failed', ['error' => $e->getMessage()]);
            return response()->json([], 500);
        }
    }

    /** Attach a tag (by name) to a lead — auto-creates the tag if new. */
    public function attach(Request $request, $leadId)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:60',
        ]);

        try {
            $lead = Lead::findOrFail($leadId);
            $tag  = LeadTag::findOrCreateByName($validated['name']);

            // syncWithoutDetaching prevents duplicate pivots on retry.
            $lead->tags()->syncWithoutDetaching([
                $tag->id => ['user_id' => Auth::id()],
            ]);

            return back()->with('success', "Tag “{$tag->name}” added.");
        } catch (\Throwable $e) {
            Log::error('Tag attach failed', ['lead_id' => $leadId, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not add tag.']);
        }
    }

    /** Detach a tag from a lead (doesn't delete the tag itself). */
    public function detach(Request $request, $leadId, $tagId)
    {
        try {
            $lead = Lead::findOrFail($leadId);
            $lead->tags()->detach($tagId);

            return back()->with('success', 'Tag removed.');
        } catch (\Throwable $e) {
            Log::error('Tag detach failed', ['lead_id' => $leadId, 'tag_id' => $tagId, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not remove tag.']);
        }
    }
}
