<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Consultancy Agreement Verification — the consultancy counterpart of Program
 * (proposal) verification. A generated consultancy agreement enters here as
 * PENDING; a reviewer confirms / edits each fee line-item, adds internal notes,
 * then Verify → Approve. Only on approval is the client emailed the agreement.
 *
 * State lives on the lead in a single JSON column `consultancy_review`: the
 * workflow envelope PLUS the per fee-item meta under `items` (amount / status /
 * note thread). One column, because the wide `leads` row can't take a second.
 */
class ConsultancyVerificationController extends Controller
{
    // ── Read ────────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $todayStart = now()->startOfDay()->toIso8601String();
        $leads = Lead::query()
            ->whereNotNull('consultancy_review')
            ->where(function ($q) use ($todayStart) {
                $q->whereIn('consultancy_review->status', ['pending', 'verified'])
                    ->orWhere('consultancy_review->approved_at', '>=', $todayStart)
                    ->orWhere('consultancy_review->verified_at', '>=', $todayStart);
            })
            ->orderByDesc('updated_at')
            ->limit(300)
            ->get();

        $userIds = $leads->flatMap(function (Lead $l) {
            $r = is_array($l->consultancy_review) ? $l->consultancy_review : [];

            return [$r['submitted_by'] ?? null, $r['verified_by'] ?? null, $r['approved_by'] ?? null];
        })->filter()->unique()->values();
        $userNames = User::whereIn('id', $userIds)->pluck('name', 'id');

        $counts = ['pending' => 0, 'verified' => 0, 'approved_today' => 0];

        $rows = $leads->map(function (Lead $l) use ($userNames, &$counts) {
            $review = is_array($l->consultancy_review) ? $l->consultancy_review : [];
            $meta = is_array($review['items'] ?? null) ? $review['items'] : [];
            $status = $review['status'] ?? 'pending';

            if ($status === 'pending') {
                $counts['pending']++;
            } elseif ($status === 'verified') {
                $counts['verified']++;
            }
            if (! empty($review['approved_at']) && $review['approved_at'] >= now()->startOfDay()->toIso8601String()) {
                $counts['approved_today']++;
            }

            $itemKeys = is_array($review['item_keys'] ?? null) ? $review['item_keys'] : array_keys($meta);
            $items = collect($itemKeys)->map(function ($key) use ($meta) {
                $m = is_array($meta[$key] ?? null) ? $meta[$key] : [];

                return [
                    'key' => $key,
                    'label' => $m['label'] ?? $key,
                    'amount' => $m['amount'] ?? null,
                    'status' => $m['status'] ?? 'needs_check', // verified | needs_check
                    'edited' => (bool) ($m['edited'] ?? false),
                    'note' => trim((string) ($m['note'] ?? '')) ?: null,
                    'notes' => collect(is_array($m['notes'] ?? null) ? $m['notes'] : [])
                        ->map(fn ($n) => [
                            'id' => $n['id'] ?? (string) Str::uuid(),
                            'tag' => $n['tag'] ?? 'note',
                            'body' => $n['body'] ?? '',
                            'author' => $n['author'] ?? 'Staff',
                            'role' => $n['role'] ?? null,
                            'created_at' => $n['created_at'] ?? null,
                            'actioned_at' => $n['actioned_at'] ?? null,
                            'replies' => array_values(is_array($n['replies'] ?? null) ? $n['replies'] : []),
                        ])->values(),
                ];
            })->values();

            $total = $items->count();
            $confirmed = $items->where('status', 'verified')->count();

            return [
                'id' => $l->id,
                'lead_id' => $l->lead_id,
                'name' => trim("{$l->first_name} {$l->last_name}") ?: '—',
                'initials' => $this->initials("{$l->first_name} {$l->last_name}"),
                'email' => $l->email,
                'status' => $status,
                'scenario' => $review['scenario'] ?? null,
                'scenario_label' => $review['scenario_label'] ?? 'Consultancy Agreement',
                'applicant_mode' => $review['applicant_mode'] ?? 'single',
                'currency' => $review['currency'] ?? 'php',
                'currency_symbol' => ($review['currency'] ?? 'php') === 'nzd' ? 'NZ$' : 'Php',
                'submitted_at' => $review['submitted_at'] ?? null,
                'verified_at' => $review['verified_at'] ?? null,
                'approved_at' => $review['approved_at'] ?? null,
                'submitted_by' => $userNames[$review['submitted_by'] ?? null] ?? null,
                'verified_by' => $userNames[$review['verified_by'] ?? null] ?? null,
                'approved_by' => $userNames[$review['approved_by'] ?? null] ?? null,
                'items' => $items,
                'items_count' => $total,
                'confirmed_count' => $confirmed,
                'total_amount' => $items->sum(fn ($i) => (int) ($i['amount'] ?? 0)),
                'changes_requested' => $review['changes_requested'] ?? null,
            ];
        })->values();

        $isEducation = $request->user()?->role === 'education';
        $component = $isEducation ? 'portal/education/ConsultancyVerification' : 'admin/ConsultancyVerification';

        return inertia($component, [
            'proposals' => $rows,
            'counts' => $counts,
            'leadBase' => $isEducation ? '/portal/education' : '/admin',
        ]);
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /** Partial per fee-item patch: edit the amount, set the status, or set the note. */
    public function updateMeta(Request $request, Lead $lead)
    {
        $this->guardUnderReview($lead);

        $validated = $request->validate([
            'meta' => 'required|array',
            'meta.*.amount' => 'nullable|numeric|min:0|max:100000000',
            'meta.*.status' => 'nullable|in:verified,needs_check',
            'meta.*.note' => 'nullable|string|max:1000',
        ]);

        $review = is_array($lead->consultancy_review) ? $lead->consultancy_review : [];
        $meta = is_array($review['items'] ?? null) ? $review['items'] : [];
        $keys = array_keys($meta);

        foreach ($validated['meta'] as $key => $patch) {
            $key = (string) $key;
            if (! in_array($key, $keys, true)) {
                continue; // only items already on this agreement
            }
            $current = is_array($meta[$key] ?? null) ? $meta[$key] : [];

            if (array_key_exists('amount', $patch)) {
                $current['amount'] = ($patch['amount'] === '' || $patch['amount'] === null) ? null : (int) $patch['amount'];
                $current['edited'] = true;
            }
            foreach (['status', 'note'] as $k) {
                if (array_key_exists($k, $patch)) {
                    $current[$k] = $patch[$k] === '' ? null : $patch[$k];
                }
            }
            $meta[$key] = $current;
        }

        $review['items'] = $meta;
        $lead->consultancy_review = $review;
        $lead->save();

        return back()->with('success', 'Updated.');
    }

    /** Bounce the consultancy agreement back to the submitter with a note. */
    public function requestChanges(Request $request, Lead $lead)
    {
        $this->guardUnderReview($lead);

        $validated = $request->validate([
            'message' => 'nullable|string|max:2000',
            'item_keys' => 'nullable|array',
            'item_keys.*' => 'string',
        ]);

        $review = is_array($lead->consultancy_review) ? $lead->consultancy_review : [];
        $meta = is_array($review['items'] ?? null) ? $review['items'] : [];
        $flagged = array_values(array_intersect($validated['item_keys'] ?? [], array_keys($meta)));

        $review['status'] = 'pending';
        $review['changes_requested'] = [
            'message' => trim((string) ($validated['message'] ?? '')) ?: 'Please revise this consultancy agreement.',
            'item_keys' => $flagged,
            'by' => $request->user()->id,
            'at' => now()->toIso8601String(),
        ];

        // Drop a "change requested" note on each flagged item's thread.
        if (! empty($flagged)) {
            $u = $request->user();
            foreach ($flagged as $key) {
                $entry = is_array($meta[$key] ?? null) ? $meta[$key] : [];
                $notes = is_array($entry['notes'] ?? null) ? $entry['notes'] : [];
                $notes[] = $this->noteEntry($u, $review['changes_requested']['message'], 'change_requested');
                $entry['notes'] = $notes;
                $meta[$key] = $entry;
            }
        }

        $review['items'] = $meta;
        $lead->consultancy_review = $review;
        $lead->save();

        return back()->with('success', 'Changes requested — the submitter has been flagged.');
    }

    /** Step 1 — mark a pending agreement as verified. */
    public function verify(Request $request, Lead $lead)
    {
        $review = is_array($lead->consultancy_review) ? $lead->consultancy_review : [];
        abort_unless(($review['status'] ?? null) === 'pending', 422, 'This agreement is not awaiting verification.');

        $review['status'] = 'verified';
        $review['verified_at'] = now()->toIso8601String();
        $review['verified_by'] = $request->user()->id;
        unset($review['changes_requested']);
        $lead->consultancy_review = $review;
        $lead->save();

        return back()->with('success', 'Agreement verified — approve it to send to the client.');
    }

    /**
     * Step 2 — approve: send the consultancy agreement to the client. `verify_all`
     * confirms every fee item first; `send_email=0` approves without emailing.
     */
    public function approve(Request $request, Lead $lead)
    {
        $review = is_array($lead->consultancy_review) ? $lead->consultancy_review : [];
        abort_unless(in_array($review['status'] ?? null, ['pending', 'verified'], true), 422, 'This agreement cannot be approved.');

        $sendEmail = $request->boolean('send_email', true);
        $verifyAll = $request->boolean('verify_all', false);

        if ($verifyAll) {
            $meta = is_array($review['items'] ?? null) ? $review['items'] : [];
            foreach ($meta as $key => $m) {
                $meta[$key] = array_merge(is_array($m) ? $m : [], ['status' => 'verified']);
            }
            $review['items'] = $meta;
            if (($review['status'] ?? null) === 'pending') {
                $review['verified_at'] = now()->toIso8601String();
                $review['verified_by'] = $request->user()->id;
            }
        }

        $review['status'] = 'approved';
        $review['approved_at'] = now()->toIso8601String();
        $review['approved_by'] = $request->user()->id;
        $review['emailed'] = $sendEmail;
        unset($review['changes_requested']);
        $lead->consultancy_review = $review;
        $lead->save();

        if ($sendEmail) {
            try {
                app(\App\Http\Controllers\LeadDocumentController::class)->sendConsultancyAgreementEmail($lead->fresh());
            } catch (\Throwable $e) {
                Log::warning('Consultancy approval email failed', ['lead_id' => $lead->id, 'error' => $e->getMessage()]);
            }
        }

        return back()->with('success', $sendEmail
            ? 'Consultancy agreement approved — the client has been emailed.'
            : 'Consultancy agreement approved (no email sent).');
    }

    // ── Per-item notes (thread) ────────────────────────────────────────────────

    public function addNote(Request $request, Lead $lead, string $item)
    {
        $data = $request->validate(['body' => 'required|string|max:2000', 'tag' => 'nullable|in:note,change_requested']);
        $this->mutateItem($lead, $item, function (&$entry) use ($request, $data) {
            $entry['notes'][] = $this->noteEntry($request->user(), $data['body'], $data['tag'] ?? 'note');
        });

        return back()->with('success', 'Note added.');
    }

    public function replyNote(Request $request, Lead $lead, string $item, string $noteId)
    {
        $data = $request->validate(['body' => 'required|string|max:2000']);
        $this->mutateItem($lead, $item, function (&$entry) use ($request, $data, $noteId) {
            foreach ($entry['notes'] as &$n) {
                if (($n['id'] ?? null) === $noteId) {
                    $u = $request->user();
                    $n['replies'][] = [
                        'id' => (string) Str::uuid(),
                        'body' => $data['body'],
                        'author' => $u->name,
                        'author_id' => $u->id,
                        'role' => $u->role,
                        'created_at' => now()->toIso8601String(),
                    ];
                }
            }
        });

        return back()->with('success', 'Reply added.');
    }

    public function toggleActioned(Request $request, Lead $lead, string $item, string $noteId)
    {
        $this->mutateItem($lead, $item, function (&$entry) use ($request, $noteId) {
            foreach ($entry['notes'] as &$n) {
                if (($n['id'] ?? null) === $noteId) {
                    $done = ! empty($n['actioned_at']);
                    $n['actioned_at'] = $done ? null : now()->toIso8601String();
                    $n['actioned_by'] = $done ? null : $request->user()->id;
                }
            }
        });

        return back();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private function guardUnderReview(Lead $lead): void
    {
        $review = is_array($lead->consultancy_review) ? $lead->consultancy_review : [];
        abort_unless(in_array($review['status'] ?? null, ['pending', 'verified'], true), 422, 'This agreement is not under review.');
    }

    /** Load an item entry, mutate it via the callback, and persist. 404s if unknown. */
    private function mutateItem(Lead $lead, string $item, callable $fn): void
    {
        $review = is_array($lead->consultancy_review) ? $lead->consultancy_review : [];
        $meta = is_array($review['items'] ?? null) ? $review['items'] : [];
        abort_unless(array_key_exists($item, $meta), 404, 'Unknown fee item.');

        $entry = is_array($meta[$item]) ? $meta[$item] : [];
        $entry['notes'] = is_array($entry['notes'] ?? null) ? $entry['notes'] : [];
        $fn($entry);
        $meta[$item] = $entry;

        $review['items'] = $meta;
        $lead->consultancy_review = $review;
        $lead->save();
    }

    private function noteEntry(User $u, string $body, string $tag): array
    {
        return [
            'id' => (string) Str::uuid(),
            'tag' => $tag,
            'body' => $body,
            'author' => $u->name,
            'author_id' => $u->id,
            'role' => $u->role,
            'created_at' => now()->toIso8601String(),
            'actioned_at' => null,
            'actioned_by' => null,
            'replies' => [],
        ];
    }

    private function initials(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $letters = collect($parts)->filter()->take(2)->map(fn ($w) => strtoupper($w[0] ?? ''));

        return $letters->implode('') ?: '—';
    }
}
