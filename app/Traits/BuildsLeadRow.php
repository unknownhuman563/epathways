<?php

namespace App\Traits;

use App\Models\Lead;

/**
 * Shared lead-row builder used by Sales, Education, and Immigration portal
 * controllers so the Leads.jsx table receives an identical shape no matter
 * which portal rendered it.
 */
trait BuildsLeadRow
{
    protected function leadRow(Lead $l): array
    {
        $ai = is_array($l->ai_analysis) ? $l->ai_analysis : [];

        $sourceLabel = $l->source
            ? $this->prettifySource((string) $l->source)
            : ($l->event ? "Event: {$l->event->name}" : ($l->branch ?: 'Online form'));

        // Pre-screen and goal-setting summaries are kept as note "kinds"
        // (see LeadNoteController). Surface the most-recent of each so
        // the leads index can show a compact at-a-glance row without
        // round-tripping into the lead detail page.
        $latestPreScreen   = $l->relationLoaded('notes')
            ? $l->notes->where('kind', 'pre_screen')->sortByDesc('created_at')->first()
            : $l->notes()->where('kind', 'pre_screen')->latest()->first();
        $latestGoalSetting = $l->relationLoaded('notes')
            ? $l->notes->where('kind', 'goal_setting')->sortByDesc('created_at')->first()
            : $l->notes()->where('kind', 'goal_setting')->latest()->first();

        return [
            'id'                       => $l->id,
            'lead_id'                  => $l->lead_id,
            // Customer-shareable code — drives the "Copy tracking link"
            // action in the Leads row menu so staff can paste a
            // /track/{code} URL straight to the client.
            'tracking_code'            => $l->tracking_code,
            'name'                     => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
            'email'                    => $l->email,
            'phone'                    => $l->phone,
            'country'                  => $l->residence_country ?: $l->country,
            'course'                   => optional($l->studyPlans->first())->preferred_course,
            'source'                   => $sourceLabel,
            'status'                   => $l->status ?: 'New',
            'stage'                    => $l->stage,
            'ai_status'                => $l->ai_analysis_status,
            'ai_score'                 => $ai['overall_score'] ?? null,
            'ai_pathway'               => $ai['recommended_pathway'] ?? null,
            'ai_department'            => $ai['recommended_department'] ?? null,
            'created_at'               => $l->created_at,
            'portal_invitation_status' => $l->portal_invitation_status ?: 'none',
            'portal_last_login_at'     => optional($l->portalUser)->last_login_at,

            // Activity counters — fed by withCount on the controller.
            'notes_count'              => (int) ($l->notes_count ?? $l->notes()->count()),
            'tasks_open_count'         => (int) ($l->tasks_open_count ?? $l->tasks()->where('completed', false)->count()),
            'documents_count'          => (int) ($l->documents_count ?? $l->documents()->count()),

            // Latest pre-screen and goal-setting notes for the expanded
            // row panel. Null when nothing has been captured yet.
            'latest_pre_screen' => $latestPreScreen ? [
                'author'   => $latestPreScreen->pre_screened_by ?: $latestPreScreen->author_name,
                'mode'     => $latestPreScreen->pre_screen_mode,
                'date'     => optional($latestPreScreen->pre_screen_date)->toDateString(),
                'body'     => $latestPreScreen->body,
                'when'     => optional($latestPreScreen->created_at)->toIso8601String(),
            ] : null,
            'latest_goal_setting' => $latestGoalSetting ? [
                'status'   => $latestGoalSetting->goal_setting_status,
                'by'       => $latestGoalSetting->goal_setting_by ?: $latestGoalSetting->author_name,
                'body'     => $latestGoalSetting->body,
                'when'     => optional($latestGoalSetting->created_at)->toIso8601String(),
            ] : null,

            // Sales-dashboard mirror columns (flat for easy table rendering).
            'pre_screened_by'        => $latestPreScreen?->pre_screened_by ?: $latestPreScreen?->author_name,
            'pre_screening_notes'    => $latestPreScreen?->body,
            'goal_setting_by'        => $latestGoalSetting?->goal_setting_by ?: $latestGoalSetting?->author_name,
            'goal_setting_status'    => $latestGoalSetting?->goal_setting_status,
            'goal_setting_notes'     => $latestGoalSetting?->body,
            'program_offered'        => optional($l->studyPlans->first())->preferred_course,
            'calendar_date'          => optional($l->calendar_date)->toDateString(),
            'client_info_link'       => $l->client_info_link,
            'call_update_form_link'  => $l->call_update_form_link,

            // Recent internal notes (all kinds) for the expander — so staff
            // see general notes alongside pre-screen / goal-setting captures.
            'recent_notes' => ($l->relationLoaded('notes') ? $l->notes : $l->notes()->latest()->limit(6)->get())
                ->sortByDesc('pinned')->sortByDesc('created_at')->take(6)->values()->map(fn ($n) => [
                    'id'                  => $n->id,
                    'kind'                => $n->kind ?: 'general',
                    'body'                => $n->body,
                    'author_name'         => $n->author_name ?: 'Unknown',
                    'author_role'         => $n->author_role,
                    'pinned'              => (bool) $n->pinned,
                    'pre_screened_by'     => $n->pre_screened_by,
                    'pre_screen_mode'     => $n->pre_screen_mode,
                    'goal_setting_status' => $n->goal_setting_status,
                    'goal_setting_by'     => $n->goal_setting_by,
                    'created_at'          => optional($n->created_at)->toIso8601String(),
                ]),
        ];
    }

    protected function prettifySource(string $source): string
    {
        return ucwords(str_replace(['-', ':', '_'], [' ', ' / ', ' '], $source));
    }
}
