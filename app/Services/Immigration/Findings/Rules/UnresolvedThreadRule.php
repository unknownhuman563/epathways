<?php

namespace App\Services\Immigration\Findings\Rules;

use App\Models\CaseThread;
use App\Models\Lead;
use App\Models\User;
use App\Services\Immigration\Findings\FindingRule;
use App\Services\Immigration\Findings\RuleResult;

/**
 * An anchored thread that requires an answer and has sat unresolved past a
 * configurable age (Build 12 phase 6, §7). Graduated from "couldn't verify" now
 * that case_threads exists.
 *
 * The finding's audience follows the addressee's role: a question put to the
 * licensed adviser surfaces to the adviser, everything else to staff — so the
 * person who owes the answer is the one who sees it. Resolving the thread stops
 * it being emitted, so the engine auto-resolves the finding (§8a).
 */
class UnresolvedThreadRule implements FindingRule
{
    public function evaluate(Lead $lead): RuleResult
    {
        $days = (int) config('immigration.findings.thread_unanswered_days', 3);
        $cutoff = now()->subDays($days);

        $threads = CaseThread::query()
            ->where('lead_id', $lead->id)
            ->awaitingAnswer()
            ->where('created_at', '<=', $cutoff)
            ->with('addressedTo:id,name,role')
            ->get();

        $findings = [];

        foreach ($threads as $thread) {
            $ageDays = (int) $thread->created_at->diffInDays(now());
            $addressee = $thread->addressedTo;

            $findings[] = [
                'finding_key' => "thread_unanswered:{$thread->id}",
                'category' => 'Thread',
                'severity' => 'check',
                'title' => 'Unanswered question'
                    .($addressee ? " for {$addressee->name}" : '')
                    .($ageDays > 0 ? " — {$ageDays}d old" : ''),
                'detail' => $this->snippet($thread->body),
                'evidence' => array_filter([
                    'thread_id' => $thread->id,
                    'anchor_type' => $thread->anchor_type,
                    'anchor_key' => $thread->anchor_key,
                    'anchor_id' => $thread->anchor_id,
                    'addressed_to' => $addressee?->name,
                    'age_days' => $ageDays,
                ], fn ($v) => $v !== null && $v !== ''),
                // The one who owes the answer is the one who should see it.
                'audience' => $this->audienceFor($addressee),
            ];
        }

        return new RuleResult($findings);
    }

    /** A thread put to the licensed adviser is adviser audience; else staff. */
    private function audienceFor(?User $addressee): string
    {
        return $addressee && $addressee->role === User::ROLE_IMMIGRATION_ADVISER
            ? 'adviser'
            : 'staff';
    }

    private function snippet(string $body): string
    {
        $body = trim($body);

        return mb_strlen($body) > 160 ? mb_substr($body, 0, 160).'…' : $body;
    }
}
