<?php

namespace Database\Seeders;

use App\Models\CaseStepTemplate;
use Illuminate\Database\Seeder;

/**
 * The department's 16-step immigration process (Build 12 phase 4.5, §15.0).
 * owner_role is a FUNCTION (coordinator / qc / ops / adviser), resolved to a
 * person per-case — never a hard-coded name. Idempotent (upsert on step_key).
 *
 *   coordinator = Emma / Ange   qc = Rhandel   ops = Dev   adviser = Henry (LIA)
 *
 * Durations are business days (§15.3): "48 hrs" → 2, "24 hrs" → 1.
 * depends_on models the DAG: step 11 (payment) hangs off 07 in PARALLEL with
 * 09/10, and 12 depends on BOTH 10 and 11. A not_applicable dependency (the
 * partner fork on a non-partner case) counts as satisfied, so it blocks nothing.
 */
class CaseStepTemplateSeeder extends Seeder
{
    public function run(): void
    {
        foreach ($this->steps() as $step) {
            CaseStepTemplate::updateOrCreate(['step_key' => $step['step_key']], $step);
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function steps(): array
    {
        $dur = fn (int $days) => ['type' => 'duration', 'business_days' => $days];

        return [
            ['step_key' => '01', 'position' => 1, 'label' => 'Endorsement from EP Education',
                'owner_role' => 'coordinator', 'stage' => 'For Assessment', 'channels_required' => true, 'depends_on' => []],
            ['step_key' => '02', 'position' => 2, 'label' => 'Visa information form completed',
                'owner_role' => 'coordinator', 'stage' => 'For Assessment', 'sla' => $dur(2), 'depends_on' => ['01']],
            ['step_key' => '03', 'position' => 3, 'label' => 'Portal check — all fields filled',
                'owner_role' => 'qc', 'stage' => 'For Assessment', 'is_qc' => true, 'depends_on' => ['02']],
            ['step_key' => '04', 'position' => 4, 'label' => 'Confirmation call (scripted)',
                'owner_role' => 'coordinator', 'stage' => 'For Assessment', 'depends_on' => ['03']],
            ['step_key' => '05', 'position' => 5, 'label' => 'Acknowledgement email',
                'owner_role' => 'coordinator', 'stage' => 'For Assessment', 'channels_required' => true, 'depends_on' => ['04']],

            // Partner-visa fork — recommend the main applicant; the recommendation
            // is advice (licence-gated at the write path). Applies only to partner
            // visas; on others it's not_applicable and blocks nothing.
            ['step_key' => '06a', 'position' => 6, 'label' => 'Partner visa — recommend main applicant, client chooses in writing',
                'owner_role' => 'adviser', 'stage' => 'For Assessment',
                'applies_when' => ['type' => 'visa_is_partner'], 'depends_on' => ['05']],

            ['step_key' => '06', 'position' => 7, 'label' => 'Engagement agreement issued',
                'owner_role' => 'adviser', 'stage' => 'Agreement Sent', 'sla' => $dur(1), 'gate' => true, 'depends_on' => ['05', '06a']],
            // Marker, NOT a gate — a checkbox is a record, not evidence (§15.4).
            // Becomes a gate only when video-view telemetry exists.
            ['step_key' => '07', 'position' => 8, 'label' => 'Video, booking and signature',
                'owner_role' => 'coordinator', 'stage' => 'Agreement Signed', 'gate' => false, 'depends_on' => ['06']],
            // applies_when is the §14.5 default (first-5-per-adviser by ordinal),
            // NOT adviser_case_count_lte. Unresolved — confirm before relying on it.
            ['step_key' => '08', 'position' => 9, 'label' => 'QC audit of the trail',
                'owner_role' => 'qc', 'stage' => 'Agreement Signed', 'is_qc' => true,
                'applies_when' => ['type' => 'adviser_case_ordinal_lte', 'n' => 5], 'depends_on' => ['07']],

            ['step_key' => '09', 'position' => 10, 'label' => 'Checklist and documents sent',
                'owner_role' => 'coordinator', 'stage' => 'For Agreement & Invoice', 'depends_on' => ['07']],
            ['step_key' => '10', 'position' => 11, 'label' => 'Two-line document check',
                'owner_role' => 'qc', 'stage' => 'For Agreement & Invoice', 'is_qc' => true, 'depends_on' => ['09']],
            // Runs IN PARALLEL with 09/10 — depends on 07, not on the doc steps.
            ['step_key' => '11', 'position' => 12, 'label' => 'Payment received',
                'owner_role' => 'coordinator', 'stage' => 'Invoice Paid', 'depends_on' => ['07']],

            ['step_key' => '12', 'position' => 13, 'label' => 'Upload to INZ portal',
                'owner_role' => 'adviser', 'stage' => 'Visa Lodged', 'sla' => $dur(2), 'gate' => true, 'depends_on' => ['10', '11']],
            ['step_key' => '13', 'position' => 14, 'label' => 'Lodged',
                'owner_role' => 'adviser', 'stage' => 'Visa Lodged', 'depends_on' => ['12']],
            ['step_key' => '14', 'position' => 15, 'label' => 'Friday status updates',
                'owner_role' => 'coordinator', 'stage' => 'Visa Lodged',
                'sla' => ['type' => 'recurring', 'every' => 'week', 'weekday' => 'friday'], 'depends_on' => ['13']],
            ['step_key' => '15', 'position' => 16, 'label' => 'Halfway chase with Immigration',
                'owner_role' => 'adviser', 'stage' => 'Visa Lodged',
                'sla' => ['type' => 'milestone', 'of' => 'processing', 'fraction' => 0.5], 'depends_on' => ['13']],
            // Terminal milestone — the outcome (approved / declined) sets the
            // final stage, so this step carries no stage of its own.
            ['step_key' => '16', 'position' => 17, 'label' => 'Decision',
                'owner_role' => 'adviser', 'stage' => null, 'depends_on' => ['13']],
        ];
    }
}
