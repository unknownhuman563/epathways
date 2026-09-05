<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

/**
 * Threaded per-programme notes for the Proposals & Agreements review inbox.
 * Stored inside leads.proposed_program_meta[<programId>].notes as an array of
 * { id, tag, body, author, author_id, role, created_at, actioned_at,
 *   actioned_by, replies: [{ id, body, author, author_id, role, created_at }] }.
 * No separate table — the shortlist meta already travels with the lead.
 */
class ProposalNoteController extends Controller
{
    /** Add a note (tag: note | change_requested) to one programme. */
    public function store(Request $request, Lead $lead, int $program)
    {
        $data = $request->validate([
            'body' => 'required|string|max:2000',
            'tag' => 'nullable|in:note,change_requested',
        ]);

        $this->guardProgram($lead, $program);
        $u = $request->user();

        $note = [
            'id' => (string) Str::uuid(),
            'tag' => $data['tag'] ?? 'note',
            'body' => trim($data['body']),
            'author' => $u->name,
            'author_id' => $u->id,
            'role' => $u->role,
            'created_at' => now()->toIso8601String(),
            'actioned_at' => null,
            'actioned_by' => null,
            'replies' => [],
        ];

        $this->mutate($lead, $program, fn (array $notes) => [...$notes, $note]);

        return back()->with('success', 'Note added.');
    }

    /** Reply to a note thread. */
    public function reply(Request $request, Lead $lead, int $program, string $note)
    {
        $data = $request->validate(['body' => 'required|string|max:2000']);
        $this->guardProgram($lead, $program);
        $u = $request->user();

        $reply = [
            'id' => (string) Str::uuid(),
            'body' => trim($data['body']),
            'author' => $u->name,
            'author_id' => $u->id,
            'role' => $u->role,
            'created_at' => now()->toIso8601String(),
        ];

        $this->mutate($lead, $program, fn (array $notes) => array_map(function ($n) use ($note, $reply) {
            if (($n['id'] ?? null) === $note) {
                $n['replies'] = [...($n['replies'] ?? []), $reply];
            }

            return $n;
        }, $notes));

        return back()->with('success', 'Reply added.');
    }

    /** Toggle a note's "actioned / acknowledged" state. */
    public function toggleActioned(Request $request, Lead $lead, int $program, string $note)
    {
        $this->guardProgram($lead, $program);
        $u = $request->user();

        $this->mutate($lead, $program, fn (array $notes) => array_map(function ($n) use ($note, $u) {
            if (($n['id'] ?? null) === $note) {
                $done = ! empty($n['actioned_at']);
                $n['actioned_at'] = $done ? null : now()->toIso8601String();
                $n['actioned_by'] = $done ? null : $u->name;
            }

            return $n;
        }, $notes));

        return back()->with('success', 'Updated.');
    }

    /** Delete a note the current user authored (or admins). */
    public function destroy(Request $request, Lead $lead, int $program, string $note)
    {
        $this->guardProgram($lead, $program);
        $u = $request->user();

        $this->mutate($lead, $program, fn (array $notes) => array_values(array_filter(
            $notes,
            fn ($n) => ($n['id'] ?? null) !== $note
                || (($n['author_id'] ?? null) !== $u->id && ! $u->isAtLeast('admin'))
        )));

        return back()->with('success', 'Note removed.');
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private function guardProgram(Lead $lead, int $program): void
    {
        $ids = array_map('intval', is_array($lead->proposed_program_ids) ? $lead->proposed_program_ids : []);
        abort_unless(in_array($program, $ids, true), 404, 'That programme is not on this proposal.');
    }

    /** Load → transform → save the notes array for one programme. */
    private function mutate(Lead $lead, int $program, callable $fn): void
    {
        $meta = is_array($lead->proposed_program_meta) ? $lead->proposed_program_meta : [];
        $key = (string) $program;
        $entry = is_array($meta[$key] ?? null) ? $meta[$key] : [];
        $entry['notes'] = array_values($fn(is_array($entry['notes'] ?? null) ? $entry['notes'] : []));
        $meta[$key] = $entry;
        $lead->proposed_program_meta = $meta;
        $lead->save();
    }
}
