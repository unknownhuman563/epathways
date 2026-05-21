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

        return [
            'id'                       => $l->id,
            'lead_id'                  => $l->lead_id,
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
        ];
    }

    protected function prettifySource(string $source): string
    {
        return ucwords(str_replace(['-', ':', '_'], [' ', ' / ', ' '], $source));
    }
}
