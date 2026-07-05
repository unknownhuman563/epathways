<?php

namespace App\Traits;

use App\Models\Lead;
use App\Models\LeadNote;
use App\Models\LeadStudyPlan;
use Illuminate\Support\Facades\Auth;

/**
 * Shared "Add Lead" handler used by the Sales and Education portals. Mirrors
 * the columns of the team's Sales Dashboard sheet: a single name, a status,
 * pre-screening + goal-setting captures (stored as LeadNote "kinds" so they
 * render in the leads-table expander), a program offered (a study plan), and
 * the calendar / link columns that live on the lead itself.
 */
trait CreatesDashboardLead
{
    /**
     * Validation rules for the dashboard add-lead form. Status is validated
     * against the calling controller's pipeline list.
     */
    protected function dashboardLeadRules(array $statuses): array
    {
        return [
            'first_name'            => 'required|string|max:120',
            'last_name'             => 'nullable|string|max:120',
            'suffix'                => 'nullable|string|max:30',
            'email'                 => 'nullable|email|max:200',
            'phone'                 => 'nullable|string|max:40',
            'status'                => ['nullable', \Illuminate\Validation\Rule::in($statuses)],
            'assessment_date'       => 'nullable|date',
            'pre_screened_by'       => 'nullable|string|max:120',
            'pre_screening_notes'   => 'nullable|string|max:2000',
            'program_offered'       => 'nullable|string|max:200',
            'goal_setting_by'       => 'nullable|string|max:120',
            'goal_setting_status'   => ['nullable', \Illuminate\Validation\Rule::in([
                'Consultation Done', 'For Proposal', 'Proposal Sent', 'No Show',
            ])],
            'goal_setting_notes'    => 'nullable|string|max:2000',
            'calendar_date'         => 'nullable|date',
            'client_info_link'      => 'nullable|url|max:500',
            'call_update_form_link' => 'nullable|url|max:500',
        ];
    }

    /**
     * Staff who can pre-screen / run goal-setting — sales, education and
     * admin users, for the "by" dropdowns on the Add Lead form.
     */
    protected function dashboardStaff()
    {
        return \App\Models\User::whereIn('role', ['sales', 'education', 'admin'])
            ->orderBy('name')
            ->get(['id', 'name', 'role', 'avatar_path']);
    }

    /**
     * Create a lead + its dashboard side-records from validated form data.
     */
    protected function createDashboardLead(array $data): Lead
    {
        // Everything below must succeed together — a failed study-plan or
        // note insert should not leave an orphaned lead behind.
        return \Illuminate\Support\Facades\DB::transaction(fn () => $this->persistDashboardLead($data));
    }

    private function persistDashboardLead(array $data): Lead
    {
        // first_name / last_name are NOT NULL. The suffix (Jr., III, …) has
        // no column of its own, so append it to the surname for display:
        // "Juan" / "Dela Cruz Jr." renders as "Juan Dela Cruz Jr.".
        $first = trim($data['first_name']);
        $last  = trim(($data['last_name'] ?? '') . ' ' . ($data['suffix'] ?? ''));

        $status = $data['status'] ?? 'New Leads';

        $lead = new Lead([
            'first_name'            => $first,
            'last_name'             => $last,
            'email'                 => $data['email'] ?? null,
            'phone'                 => $data['phone'] ?? null,
            'status'                => $status,
            'stage'                 => $status,
            'source'                => 'manual',
            'calendar_date'         => $data['calendar_date'] ?? null,
            'client_info_link'      => $data['client_info_link'] ?? null,
            'call_update_form_link' => $data['call_update_form_link'] ?? null,
        ]);

        // Human-friendly reference, matching the CSV importer's scheme.
        $lead->lead_id = 'LP-' . str_pad((string) ((int) Lead::max('id') + 1001), 5, '0', STR_PAD_LEFT);
        $lead->save();

        // ASSESSMENT DATE → treat as the lead's creation date so it sorts and
        // reports alongside the dashboard sheet. saveQuietly avoids a second
        // audit entry for the timestamp tweak.
        if (! empty($data['assessment_date'])) {
            $lead->created_at = \Illuminate\Support\Carbon::parse($data['assessment_date']);
            $lead->saveQuietly();
        }

        // PROGRAM OFFERED → a study plan row (what the table reads back).
        // qualification_level is NOT NULL with no default; the dashboard
        // form doesn't capture it, so store an empty string.
        if (! empty($data['program_offered'])) {
            LeadStudyPlan::create([
                'lead_id'             => $lead->id,
                'preferred_course'    => $data['program_offered'],
                'qualification_level' => '',
            ]);
        }

        $user = Auth::user();

        // PRE-SCREENING — only when there's something to capture.
        if (! empty($data['pre_screened_by']) || ! empty($data['pre_screening_notes'])) {
            LeadNote::create([
                'lead_id'         => $lead->id,
                'user_id'         => $user?->id,
                'author_name'     => $user?->name,
                'author_role'     => $user?->role,
                'kind'            => 'pre_screen',
                'pre_screened_by' => $data['pre_screened_by'] ?? null,
                'body'            => $data['pre_screening_notes'] ?: 'Pre-screening recorded.',
            ]);
        }

        // GOAL-SETTING — only when there's something to capture.
        if (! empty($data['goal_setting_by']) || ! empty($data['goal_setting_status']) || ! empty($data['goal_setting_notes'])) {
            LeadNote::create([
                'lead_id'             => $lead->id,
                'user_id'             => $user?->id,
                'author_name'         => $user?->name,
                'author_role'         => $user?->role,
                'kind'                => 'goal_setting',
                'goal_setting_by'     => $data['goal_setting_by'] ?? null,
                'goal_setting_status' => $data['goal_setting_status'] ?? null,
                'body'                => $data['goal_setting_notes'] ?: 'Goal-setting recorded.',
            ]);
        }

        return $lead;
    }
}
