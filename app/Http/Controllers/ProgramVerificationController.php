<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Program Verification — a restricted module (module:program_verification,
 * default super-admin-only, grantable per user). Staff submit a Study Proposal
 * "for verification"; here it is reviewed in two steps — Verify then Approve.
 * Only on approval does the proposal become visible on the client's tracker and
 * the client email fire.
 */
class ProgramVerificationController extends Controller
{
    public function index(Request $request)
    {
        // Leads whose study proposal is awaiting review (pending or verified).
        $leads = Lead::query()
            ->whereNotNull('proposed_program_ids')
            ->whereIn('proposal_review->status', ['pending', 'verified'])
            ->orderByDesc('updated_at')
            ->limit(200)
            ->get();

        // Programs across every pending shortlist, resolved once.
        $allIds = $leads->flatMap(fn ($l) => is_array($l->proposed_program_ids) ? $l->proposed_program_ids : [])
            ->map(fn ($x) => (int) $x)->unique()->values();
        $programs = Program::whereIn('id', $allIds)
            ->get(['id', 'title', 'level', 'category', 'location', 'price_text'])
            ->keyBy('id');

        $rows = $leads->map(function (Lead $l) use ($programs) {
            $ids = is_array($l->proposed_program_ids) ? array_map('intval', $l->proposed_program_ids) : [];
            $reasons = is_array($l->proposed_program_reasons) ? $l->proposed_program_reasons : [];
            $review = is_array($l->proposal_review) ? $l->proposal_review : [];

            return [
                'id' => $l->id,
                'lead_id' => $l->lead_id,
                'name' => trim("{$l->first_name} {$l->last_name}") ?: '—',
                'email' => $l->email,
                'status' => $review['status'] ?? 'pending',
                'submitted_at' => $review['submitted_at'] ?? null,
                'verified_at' => $review['verified_at'] ?? null,
                'programs' => collect($ids)
                    ->map(fn ($id) => $programs->get($id))
                    ->filter()
                    ->map(fn ($p) => [
                        'id' => $p->id,
                        'title' => $p->title,
                        'level' => $p->level,
                        'category' => $p->category,
                        'location' => $p->location,
                        'price_text' => $p->price_text,
                        'reason' => trim((string) ($reasons[(string) $p->id] ?? '')) ?: null,
                    ])->values(),
            ];
        })->values();

        // Education staff (e.g. Dinah) get the Education-portal chrome; everyone
        // else (super admins) get the admin layout — same page, two wrappers.
        $isEducation = $request->user()?->role === 'education';
        $component = $isEducation ? 'portal/education/ProgramVerification' : 'admin/ProgramVerification';

        // Full program catalogue so Dinah can swap / add / remove programs.
        $catalogue = Program::orderBy('title')
            ->get(['id', 'title', 'level', 'category', 'location', 'price_text'])
            ->map(fn ($p) => [
                'id' => $p->id, 'title' => $p->title, 'level' => $p->level,
                'category' => $p->category, 'location' => $p->location, 'price_text' => $p->price_text,
            ])->values();

        return inertia($component, [
            'proposals' => $rows,
            'programs' => $catalogue,
            // Where "Open lead" points for this viewer.
            'leadBase' => $isEducation ? '/portal/education' : '/admin',
        ]);
    }

    /**
     * Dinah edits the shortlist — swap a program, change how many, or update
     * reasons — while it's still in review. Keeps the current status (pending/
     * verified) so it isn't accidentally re-submitted.
     */
    public function updatePrograms(Request $request, Lead $lead)
    {
        $review = is_array($lead->proposal_review) ? $lead->proposal_review : [];
        abort_unless(in_array($review['status'] ?? null, ['pending', 'verified'], true), 422, 'This proposal is not under review.');

        $validated = $request->validate([
            'program_ids' => 'required|array|min:1|max:5',
            'program_ids.*' => 'integer|exists:programs,id',
            'reasons' => 'nullable|array',
            'reasons.*' => 'nullable|string|max:1000',
        ]);

        $ids = array_values(array_unique(array_map('intval', $validated['program_ids'])));

        $reasons = [];
        foreach (($validated['reasons'] ?? []) as $pid => $text) {
            $pid = (int) $pid;
            $text = trim((string) $text);
            if ($text !== '' && in_array($pid, $ids, true)) {
                $reasons[(string) $pid] = $text;
            }
        }

        // Editing clears any client pick that's no longer in the shortlist.
        if ($lead->preferred_program_id && ! in_array((int) $lead->preferred_program_id, $ids, true)) {
            $lead->preferred_program_id = null;
            $lead->preferred_program_chosen_at = null;
        }

        $lead->proposed_program_ids = $ids;
        $lead->proposed_program_reasons = $reasons ?: null;
        $lead->save();

        return back()->with('success', 'Programs updated.');
    }

    /** Step 1 — mark a pending proposal as verified (reviewed). */
    public function verify(Request $request, Lead $lead)
    {
        $review = is_array($lead->proposal_review) ? $lead->proposal_review : [];
        abort_unless(($review['status'] ?? null) === 'pending', 422, 'This proposal is not awaiting verification.');

        $review['status'] = 'verified';
        $review['verified_at'] = now()->toIso8601String();
        $review['verified_by'] = $request->user()->id;
        $lead->proposal_review = $review;
        $lead->save();

        return back()->with('success', 'Proposal verified — approve it to send to the client.');
    }

    /** Step 2 — approve: make it live on the tracker and email the client. */
    public function approve(Request $request, Lead $lead)
    {
        $review = is_array($lead->proposal_review) ? $lead->proposal_review : [];
        abort_unless(in_array($review['status'] ?? null, ['pending', 'verified'], true), 422, 'This proposal cannot be approved.');

        $review['status'] = 'approved';
        $review['approved_at'] = now()->toIso8601String();
        $review['approved_by'] = $request->user()->id;
        $lead->proposal_review = $review;
        $lead->save();

        // Now that it's live, email the client (best-effort — non-fatal).
        try {
            app(\App\Http\Controllers\LeadDocumentController::class)->sendProposalReadyEmail($lead->fresh());
        } catch (\Throwable $e) {
            Log::warning('Proposal approval email failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
        }

        return back()->with('success', 'Proposal approved — the client can now see it on their tracker.');
    }
}
