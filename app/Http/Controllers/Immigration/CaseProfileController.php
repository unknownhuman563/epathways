<?php

namespace App\Http\Controllers\Immigration;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\CaseAuditView;
use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\LeadNote;
use App\Models\ResidentIntake;
use App\Models\StudentIntake;
use App\Models\User;
use App\Models\VisaType;
use App\Models\VisitorIntake;
use App\Models\WorkIntake;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * Build 11.D — Case Profile.
 *
 * Purpose-built workspace for an immigration case. Distinct from the
 * sales/lead detail page (admin/LeadDetails.jsx) so the case workflow
 * isn't a lowest-common-denominator overlay on a sales lead view.
 *
 * Six tabs, one Inertia page:
 *   Assessment · Documents · Agreement · Communications · AI Health · Notes
 *
 * Access is admin + immigration only (mirrors the Build 10 case-analysis
 * gate at app/Http/Controllers/Api/AiCaseAnalysisController.php — same
 * sensitivity, same policy).
 *
 * Privacy Act 2020: every render writes a CaseAuditView row. This was a
 * specific finding in docs/audits/VISA_ASSESSMENT_CASE_DETAIL_AUDIT_2026-06-22.md
 * — intake detail pages currently leave no audit trail. This page closes
 * that gap for case views.
 */
class CaseProfileController extends Controller
{
    public function show(Lead $lead)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);

        $this->ensureCanViewCases($user);

        // Hard 404 on non-cases. This endpoint is case-only; non-cases
        // continue to use LeadController::show via /admin/leads/{id} etc.
        abort_unless($lead->is_immigration_case, 404);

        $this->writeAuditView($lead, $user);

        [$intakeType, $intake] = $this->resolveIntake($lead);

        return Inertia::render('portal/immigration/CaseProfile', [
            'lead'           => $this->serializeLead($lead),
            'intake'         => $intake ? ['type' => $intakeType, 'data' => $intake] : null,
            'documents'      => $this->loadDocuments($lead),
            'checklist'      => $this->loadVisaChecklist($lead),
            'communications' => $this->loadCommunications($lead),
            'agreements'     => $this->loadAgreements($lead),
            'notes'          => $this->loadNotes($lead),
            'activity'       => $this->loadActivity($lead),
        ]);
    }

    /** Same policy as Build 10's case-analysis gate. */
    private function ensureCanViewCases(User $user): void
    {
        abort_unless(
            $user->isAdmin()
                || $user->role === 'immigration'
                || in_array($user->role, User::IMMIGRATION_ROLES, true),
            403,
            'Only immigration staff may open case profiles.'
        );
    }

    /**
     * Privacy Act 2020 — record every staff view of a case for the
     * case-audit log. Mirrors the LeadController::show write at
     * app/Http/Controllers/LeadController.php:644-657 but with the
     * 'case_profile' context so the two surfaces can be told apart in
     * the audit table.
     */
    private function writeAuditView(Lead $lead, User $user): void
    {
        try {
            CaseAuditView::create([
                'lead_id'     => $lead->id,
                'viewer_id'   => $user->id,
                'viewer_name' => $user->name,
                'viewer_role' => $user->role,
                'action'      => 'view',
                'context'     => 'case_profile',
                'ip'          => request()->ip(),
                'viewed_at'   => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Case profile audit view write failed', [
                'lead_id' => $lead->id,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /**
     * Cases have two origin paths (see audit Section 6):
     *   1. Sales-converted via LeadController::convertToCase — no intake row, returns [null, null]
     *   2. Assessment-converted via Portal\ImmigrationController::convertAssessmentToCase —
     *      a polymorphic Assessment row paired with one of resident/work/student/visitor
     *      intakes. Joined to the Lead by email (no FK exists today).
     *
     * Returns [type, intakeArray] where type is 'resident'|'work'|'student'|'visitor'|null.
     */
    protected function resolveIntake(Lead $lead): array
    {
        if (! $lead->email) {
            return [null, null];
        }

        $assessment = Assessment::where('applicant_email', $lead->email)
            ->whereNotNull('intakeable_type')
            ->latest('id')
            ->first();

        if (! $assessment) {
            return [null, null];
        }

        $intake = $assessment->intakeable;
        if (! $intake) {
            return [null, null];
        }

        $type = match ($intake::class) {
            ResidentIntake::class => 'resident',
            WorkIntake::class     => 'work',
            StudentIntake::class  => 'student',
            VisitorIntake::class  => 'visitor',
            default               => null,
        };

        if ($type === null) {
            return [null, null];
        }

        return [$type, array_merge($intake->toArray(), [
            'assessment_id'             => $assessment->id,
            'assessment_status'         => $assessment->status,
            'assessment_payment_status' => $assessment->payment_status,
            'assessment_booking_id'     => $assessment->booking_id,
        ])];
    }

    private function serializeLead(Lead $lead): array
    {
        $lead->loadMissing(['assignee:id,name,email,role']);

        return [
            'id'                            => $lead->id,
            'lead_id'                       => $lead->lead_id,
            'first_name'                    => $lead->first_name,
            'last_name'                     => $lead->last_name,
            'email'                         => $lead->email,
            'phone'                         => $lead->phone,
            'dob'                           => $lead->dob,
            'tracking_code'                 => $lead->tracking_code,
            'status'                        => $lead->status,
            'stage'                         => $lead->stage,
            'immigration_stage'             => $lead->immigration_stage,
            'inz_visa_type'                 => $lead->inz_visa_type,
            'inz_reference'                 => $lead->inz_reference,
            'inz_status'                    => $lead->inz_status,
            'inz_lodged_at'                 => $lead->inz_lodged_at,
            'inz_decision_at'               => $lead->inz_decision_at,
            'is_immigration_case'           => (bool) $lead->is_immigration_case,
            'immigration_converted_at'      => $lead->immigration_converted_at,
            'immigration_converted_by'      => $lead->immigration_converted_by,
            'source'                        => $lead->source,
            'assignee'                      => $lead->assignee,
            'is_assessment_converted'       => $this->wasAssessmentConverted($lead),
        ];
    }

    /**
     * "Came from assessment" vs "came from sales". A sales-converted case has
     * no Assessment row at the lead's email; an assessment-converted case does.
     */
    private function wasAssessmentConverted(Lead $lead): bool
    {
        if (! $lead->email) {
            return false;
        }
        return Assessment::where('applicant_email', $lead->email)->exists();
    }

    private function loadDocuments(Lead $lead): array
    {
        return LeadDocument::where('lead_id', $lead->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocument $d) => [
                'id'             => $d->id,
                'checklist_key'  => $d->checklist_key,
                'original_name'  => $d->original_name,
                'mime'           => $d->mime,
                'size'           => $d->size,
                'status'         => $d->status,
                'source'         => $d->source,
                'source_variant' => $d->source_variant,
                'note'           => $d->note,
                'reviewed_at'    => $d->reviewed_at,
                'created_at'     => $d->created_at,
            ])
            ->all();
    }

    /**
     * Phase 1 returns the raw visa-type checklist + a per-lead override.
     * Phase 2 builds CaseChecklistService to merge in document statuses
     * by checklist_key. Resolution order:
     *   1. lead.document_checklist (per-case override JSON) when populated
     *   2. visa_types.checklist_items by inz_visa_type string match
     *   3. empty array
     */
    private function loadVisaChecklist(Lead $lead): array
    {
        if (! empty($lead->document_checklist)) {
            return [
                'source'   => 'lead_override',
                'visa'     => $lead->inz_visa_type,
                'items'    => $lead->document_checklist,
            ];
        }

        $visaType = $lead->inz_visa_type
            ? VisaType::where('name', $lead->inz_visa_type)->first()
            : null;

        return [
            'source' => $visaType ? 'visa_type' : 'none',
            'visa'   => $visaType?->name,
            'items'  => $visaType?->checklist_items ?? [],
        ];
    }

    private function loadCommunications(Lead $lead): array
    {
        if (! $lead->email) {
            return [];
        }

        return DB::table('message_logs')
            ->where(function ($q) use ($lead) {
                $q->where(function ($qq) use ($lead) {
                    $qq->where('recipient_type', 'lead')
                       ->where('recipient_id', $lead->id);
                })->orWhere('recipient_address', $lead->email);
            })
            ->orderByDesc('id')
            ->limit(50)
            ->get([
                'id', 'channel', 'subject', 'body', 'status',
                'recipient_address', 'sent_at', 'failed_at', 'created_at',
            ])
            ->map(fn ($row) => [
                'id'                => $row->id,
                'channel'           => $row->channel,
                'subject'           => $row->subject,
                'snippet'           => $this->snippet($row->body),
                'status'            => $row->status,
                'recipient_address' => $row->recipient_address,
                'sent_at'           => $row->sent_at,
                'failed_at'         => $row->failed_at,
                'created_at'        => $row->created_at,
            ])
            ->all();
    }

    private function snippet(?string $body): string
    {
        if (! $body) return '';
        $plain = trim(strip_tags($body));
        return mb_strlen($plain) > 160 ? mb_substr($plain, 0, 160) . '…' : $plain;
    }

    /**
     * Build 11.D Phase 2 — Managed agreements for the case. Distinct from
     * any AgreementGenerator-created LeadDocument rows (those still surface
     * under the Documents tab via the existing checklist flow).
     */
    private function loadAgreements(Lead $lead): array
    {
        return $lead->agreements()
            ->with(['template:id,name,visa_type', 'generatedBy:id,name'])
            ->latest()
            ->get()
            ->map(fn (\App\Models\Agreement $a) => [
                'id'                    => $a->id,
                'title'                 => $a->title,
                'status'                => $a->status,
                'template'              => $a->template
                    ? ['id' => $a->template->id, 'name' => $a->template->name, 'visa_type' => $a->template->visa_type]
                    : null,
                'generated_by'          => $a->generatedBy?->name,
                'sent_at'               => $a->sent_at,
                'viewed_at'             => $a->viewed_at,
                'signed_at'             => $a->signed_at,
                'signer_name'           => $a->signer_name,
                'signer_ip'             => $a->signer_ip,
                'has_pdf'               => (bool) $a->pdf_path,
                'has_signed_pdf'        => (bool) $a->signed_pdf_path,
                'tracker_signing_token' => $a->tracker_signing_token,
                'created_at'            => $a->created_at,
            ])
            ->all();
    }

    private function loadNotes(Lead $lead): array
    {
        return LeadNote::where('lead_id', $lead->id)
            ->orderByDesc('pinned')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn (LeadNote $n) => [
                'id'         => $n->id,
                'body'       => $n->body,
                'pinned'     => (bool) ($n->pinned ?? false),
                'author'     => $n->author_name ?? null,
                'created_at' => $n->created_at,
            ])
            ->all();
    }

    private function loadActivity(Lead $lead): array
    {
        return \App\Models\ActivityLog::query()
            ->where('properties->subject_type', 'Lead')
            ->where('properties->subject_id', $lead->id)
            ->latest()
            ->limit(40)
            ->get()
            ->map(fn ($log) => [
                'id'          => $log->id,
                'action'      => $log->action,
                'description' => $log->description,
                'actor_name'  => $log->actor_name ?: 'System',
                'actor_role'  => $log->actor_role ?: 'public',
                'created_at'  => $log->created_at,
            ])
            ->all();
    }
}
