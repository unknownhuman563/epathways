<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadNote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Internal notes on a Lead. Any logged-in staff member can add notes; only
 * the author or an admin can edit/delete. Toggling `pinned` is an
 * any-staff action so the team can highlight key context.
 */
class LeadNoteController extends Controller
{
    public function store(Request $request, $leadId)
    {
        $validated = $request->validate([
            'body'   => 'required|string|max:2000',
            'pinned' => 'nullable|boolean',
        ]);

        try {
            $lead = Lead::findOrFail($leadId);
            $user = Auth::user();

            $note = LeadNote::create([
                'lead_id'     => $lead->id,
                'user_id'     => $user?->id,
                'author_name' => $user?->name,
                'author_role' => $user?->role,
                'body'        => $validated['body'],
                'pinned'      => (bool) ($validated['pinned'] ?? false),
            ]);

            return back()->with('success', 'Note added.');
        } catch (\Throwable $e) {
            Log::error('Lead note create failed', ['lead_id' => $leadId, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not save the note.']);
        }
    }

    public function update(Request $request, $leadId, $noteId)
    {
        $validated = $request->validate([
            'body'   => 'sometimes|string|max:2000',
            'pinned' => 'sometimes|boolean',
        ]);

        try {
            $note = LeadNote::where('lead_id', $leadId)->findOrFail($noteId);
            $user = Auth::user();

            // Author or admin can edit body; anyone can toggle pinned.
            $canEditBody = $user?->isAdmin() || $note->user_id === $user?->id;

            isset($validated['body']) && $canEditBody
                ? $note->body = $validated['body']
                : null;

            isset($validated['pinned'])
                ? $note->pinned = (bool) $validated['pinned']
                : null;

            $note->save();

            return back()->with('success', 'Note updated.');
        } catch (\Throwable $e) {
            Log::error('Lead note update failed', ['note_id' => $noteId, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not update the note.']);
        }
    }

    public function destroy(Request $request, $leadId, $noteId)
    {
        try {
            $note = LeadNote::where('lead_id', $leadId)->findOrFail($noteId);
            $user = Auth::user();

            $canDelete = $user?->isAdmin() || $note->user_id === $user?->id;
            $canDelete ? $note->delete() : abort(403, 'You can only delete your own notes.');

            return back()->with('success', 'Note deleted.');
        } catch (\Throwable $e) {
            Log::error('Lead note delete failed', ['note_id' => $noteId, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Could not delete the note.']);
        }
    }
}
