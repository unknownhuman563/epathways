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
use App\Models\VisitorIntake;
use App\Models\WorkIntake;
use App\Services\Immigration\CaseChecklistService;
use Illuminate\Http\Request;
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
    public function show(Lead $lead, CaseChecklistService $checklist, string $page = 'portal/immigration/CaseProfile')
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);

        $this->ensureCanViewCases($user);

        // Hard 404 on non-cases. This endpoint is case-only; non-cases
        // continue to use LeadController::show via /admin/leads/{id} etc.
        abort_unless($lead->is_immigration_case, 404);

        $this->writeAuditView($lead, $user);

        // Build 12 phase 4 — attention (§5). Capture the viewer's PREVIOUS open
        // before recording this one, so the header can show what changed since
        // they last looked; then record this open (throttled, passive).
        $attention = $this->buildAttention($lead, $user);
        \App\Models\CaseView::recordOpen($lead->id, $user->id);

        [$intakeType, $intake] = $this->resolveIntake($lead);

        return Inertia::render($page, [
            'lead' => $this->serializeLead($lead),
            'intake' => $intake ? ['type' => $intakeType, 'data' => $intake] : null,
            'documents' => $this->loadDocuments($lead),
            // The Visa Information Form (official assessment PDF), auto-available
            // in Documents when the case took a work/student/visitor assessment.
            'vif' => $this->resolveVif($intakeType, $intake),
            // Build 11.D Phase 4 — checklist resolution delegated to
            // CaseChecklistService. `items` is the flat list (kept for
            // backward-compat with the existing table view); `grouped`
            // partitions the same items by category; `unstructured` covers
            // docs uploaded under a no-longer-matching key; `progress`
            // drives the "X of Y required approved" header.
            'checklist' => array_merge(
                $checklist->sourceFor($lead),
                ['items' => $checklist->withStatuses($lead)],
            ),
            'checklistGrouped' => $checklist->groupedByCategory($lead),
            'unstructuredDocuments' => $checklist->unstructuredDocuments($lead),
            'checklistProgress' => $checklist->progress($lead),
            'communications' => $this->loadCommunications($lead),
            'agreements' => $this->loadAgreements($lead),
            'notes' => $this->loadNotes($lead),
            'activity' => $this->loadActivity($lead),
            // Build 12 phase 3 — case-assist findings. The last STORED result
            // (never evaluated on page load), grouped for the AI Health tab.
            'findings' => $this->loadFindings($lead),
            // Build 12 phase 4.5 — the process chain (steps, owners, gates, SLA).
            'process' => $this->loadProcess($lead),
            // Build 12 phase 6 — anchored threads, and the staff a thread can be
            // addressed to.
            'threads' => $this->loadThreads($lead),
            'caseStaff' => $this->loadCaseStaff(),
            // Build 12 phase 4 — attention: when this viewer last opened the case
            // and what changed since. Staff-only; never in a client payload.
            'attention' => $attention,
            // Case financials — fees, invoice, payment ledger, derived owed/settled
            // (replaces the spreadsheet's money columns).
            'financials' => $this->loadFinancials($lead),
            // INZ forms available for this visa type (current version + readiness).
            'inzForms' => $this->loadInzForms($lead),
            'dependents' => $this->loadDependents($lead),
            // Cases the dependant can be related to (defaults to this case).
            'caseOptions' => Lead::immigrationCase()
                ->orderBy('first_name')->limit(500)
                ->get(['id', 'lead_id', 'first_name', 'last_name'])
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'name' => (trim("{$l->first_name} {$l->last_name}") ?: $l->lead_id).($l->lead_id ? " ({$l->lead_id})" : ''),
                ])->values(),
        ]);
    }

    /**
     * Per-case financials for the Financials tab: the fee/invoice record, the
     * payment ledger, and the derived totals. Every figure is arithmetic on
     * human-entered values — nothing is generated.
     *
     * @return array<string, mixed>
     */
    private function loadFinancials(Lead $lead): array
    {
        $fin = \App\Models\CaseFinancial::where('lead_id', $lead->id)->first();

        $payments = \App\Models\CaseFinancePayment::where('lead_id', $lead->id)
            ->with('recorder:id,name')
            ->orderBy('paid_at')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'paid_at' => optional($p->paid_at)->toDateString(),
                'amount' => (float) $p->amount,
                'method' => $p->method,
                'reference' => $p->reference,
                'recorded_by' => optional($p->recorder)->name,
            ])->all();

        return [
            'referred_by' => $lead->referral,
            'record' => $fin ? [
                'service_fee_normal' => (float) $fin->service_fee_normal,
                'service_fee_chargeable' => (float) $fin->service_fee_chargeable,
                'inz_fee' => (float) $fin->inz_fee,
                'other_fee' => (float) $fin->other_fee,
                'disbursement' => $fin->disbursement !== null ? (float) $fin->disbursement : null,
                'payment_type' => $fin->payment_type,
                'inz_fee_paid_to' => $fin->inz_fee_paid_to,
                'issued_from' => $fin->issued_from,
                'invoice_no' => $fin->invoice_no,
                'invoice_sent_at' => optional($fin->invoice_sent_at)->toDateString(),
                'currency' => $fin->currency,
                'notes' => $fin->notes,
            ] : null,
            'payments' => $payments,
            'totals' => [
                'payable' => $fin ? $fin->totalPayable() : 0,
                'paid' => $fin ? $fin->totalPaid() : (float) \App\Models\CaseFinancePayment::where('lead_id', $lead->id)->sum('amount'),
                'owed' => $fin ? $fin->amountOwed() : 0,
                'disbursement' => $fin ? $fin->disbursementAmount() : 0,
                'net_after_disbursement' => $fin ? $fin->netAfterDisbursement() : 0,
                'settled' => $fin ? $fin->isSettled() : false,
            ],
        ];
    }

    /** Create/update the case's fee + invoice record, and the referral. */
    public function saveFinancials(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'service_fee_normal' => 'nullable|numeric|min:0',
            'service_fee_chargeable' => 'nullable|numeric|min:0',
            'inz_fee' => 'nullable|numeric|min:0',
            'other_fee' => 'nullable|numeric|min:0',
            'disbursement' => 'nullable|numeric|min:0',
            'payment_type' => ['nullable', \Illuminate\Validation\Rule::in(['pay_now', 'pay_later'])],
            'inz_fee_paid_to' => 'nullable|string|max:60',
            'issued_from' => 'nullable|string|max:20',
            'invoice_no' => 'nullable|string|max:60',
            'invoice_sent_at' => 'nullable|date',
            'currency' => 'nullable|string|max:8',
            'notes' => 'nullable|string|max:2000',
            'referred_by' => 'nullable|string|max:120',
        ]);

        \App\Models\CaseFinancial::updateOrCreate(
            ['lead_id' => $lead->id],
            array_merge(
                collect($data)->except('referred_by')->map(fn ($v) => $v === '' ? null : $v)->all(),
                ['updated_by' => $user->id],
            ),
        );

        // "Referred by" lives on the lead itself (shared with the rest of the CRM).
        if (array_key_exists('referred_by', $data)) {
            $lead->forceFill(['referral' => $data['referred_by'] ?: null])->save();
        }

        return back()->with('success', 'Financials saved.');
    }

    /** Add a receipt to the case's payment ledger. */
    public function addFinancePayment(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'paid_at' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'method' => 'nullable|string|max:40',
            'reference' => 'nullable|string|max:120',
        ]);

        \App\Models\CaseFinancePayment::create(array_merge($data, [
            'lead_id' => $lead->id,
            'recorded_by' => $user->id,
        ]));

        return back()->with('success', 'Payment recorded.');
    }

    /** Remove a receipt from the ledger. */
    public function deleteFinancePayment(Request $request, Lead $lead, \App\Models\CaseFinancePayment $payment)
    {
        $this->guardCase($lead);
        abort_unless($payment->lead_id === $lead->id, 404);
        $payment->delete();

        return back()->with('success', 'Payment removed.');
    }

    /**
     * Assemble the invoice view-data from the case's financial record + ledger.
     * Shared by generate (PDF), preview (HTML) and Word exports.
     *
     * @return array{0: array<string, mixed>, 1: string}  [$viewData, $invoiceNo]
     */
    private function invoiceData(Lead $lead): array
    {
        $fin = \App\Models\CaseFinancial::firstOrNew(['lead_id' => $lead->id]);
        $currency = $fin->currency ?: 'NZD';

        // Auto-assign a stable invoice number the first time one is generated.
        $invoiceNo = $fin->invoice_no ?: 'INV-'.str_pad((string) $lead->id, 4, '0', STR_PAD_LEFT);

        $lines = collect([
            ['label' => 'Professional service fee', 'amount' => (float) $fin->service_fee_chargeable],
            ['label' => 'INZ application fee', 'amount' => (float) $fin->inz_fee],
            ['label' => 'Other fee', 'amount' => (float) $fin->other_fee],
        ])->filter(fn ($l) => $l['amount'] > 0)->values()->all();

        $payments = \App\Models\CaseFinancePayment::where('lead_id', $lead->id)->orderBy('paid_at')->get()
            ->map(fn ($p) => [
                'paid_at' => optional($p->paid_at)->format('d/m/Y'),
                'method' => $p->method,
                'reference' => $p->reference,
                'amount' => (float) $p->amount,
            ])->all();

        $data = [
            'invoiceNo' => $invoiceNo,
            'invoiceDate' => optional($fin->invoice_sent_at)->format('d/m/Y') ?: now()->format('d/m/Y'),
            'generatedAt' => now()->format('d/m/Y'),
            'billTo' => trim("{$lead->first_name} {$lead->last_name}") ?: ($lead->lead_id ?: 'Applicant'),
            'caseRef' => $lead->inz_reference ?: $lead->lead_id,
            'issuedFrom' => $fin->issued_from,
            'currency' => $currency,
            'lines' => $lines,
            'totalPayable' => $fin->totalPayable(),
            'totalPaid' => $fin->totalPaid(),
            'owed' => $fin->amountOwed(),
            'disbursement' => $fin->disbursementAmount(),
            'settled' => $fin->isSettled(),
            'payments' => $payments,
            'notes' => $fin->notes,
        ];

        return [$data, $invoiceNo];
    }

    /** Inline HTML preview of the case invoice (for the Financials tab modal). */
    public function previewInvoice(Lead $lead)
    {
        $this->guardCase($lead);
        [$data] = $this->invoiceData($lead);

        return response(view('pdf.invoice', array_merge($data, ['mode' => 'web']))->render());
    }

    /**
     * Generate the case invoice PDF, store it as a draft document on the case
     * (so it appears in Documents), and stamp the invoice number + sent date on
     * the financial record. Numbers come only from the recorded fees/ledger.
     */
    public function generateInvoice(Lead $lead)
    {
        $user = $this->guardCase($lead);
        [$data, $invoiceNo] = $this->invoiceData($lead);

        $bytes = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', array_merge($data, ['mode' => 'pdf']))
            ->setPaper('a4')->output();

        $path = "inz-generated/{$lead->id}/invoice-".\Illuminate\Support\Str::uuid().'.pdf';
        \Illuminate\Support\Facades\Storage::disk('local')->put($path, $bytes);

        LeadDocument::create([
            'lead_id' => $lead->id,
            'original_name' => "Invoice {$invoiceNo}.pdf",
            'file_path' => $path,
            'mime' => 'application/pdf',
            'size' => strlen($bytes),
            'source' => 'generated',
            'source_variant' => "invoice:{$invoiceNo}",
            'status' => 'StaffShared',
            'uploaded_by' => $user->id,
        ]);

        // Persist the invoice number + sent date onto the financial record.
        \App\Models\CaseFinancial::updateOrCreate(
            ['lead_id' => $lead->id],
            ['invoice_no' => $invoiceNo, 'invoice_sent_at' => now(), 'updated_by' => $user->id],
        );

        return back()->with('success', "Invoice {$invoiceNo} generated — see Documents.");
    }

    // ── INZ forms (fill the official PDF; never a look-alike) ────────────────

    /**
     * The INZ forms available for this case's visa type, with the current
     * version and whether its official PDF is on file / lapsing. Drives the
     * "Generate INZ forms" affordance.
     *
     * @return array<int, array<string, mixed>>
     */
    private function loadInzForms(Lead $lead): array
    {
        // A case's visa type resolves to a category; the INZ forms in that
        // category are what this case can generate.
        $visaType = $lead->inz_visa_type
            ? \App\Models\VisaType::where('name', $lead->inz_visa_type)->orWhere('code', $lead->inz_visa_type)->first()
            : null;
        $category = $visaType?->category;

        $forms = $category
            ? \App\Models\InzForm::where('category', $category)->where('is_active', true)->orderBy('code')->get()
            : collect();

        $assignments = \App\Models\CaseFormAssignment::where('lead_id', $lead->id)->get()->keyBy('inz_form_id');

        return $forms->map(function (\App\Models\InzForm $f) use ($assignments) {
            $v = $f->currentVersion();
            $a = $assignments->get($f->id);

            return [
                'code' => $f->code,
                'name' => $f->name,
                'category' => $f->category,
                'version' => $v?->version_label,
                'ready' => $v?->isReady() ?? false,           // official PDF uploaded + fillable
                'lapsing' => $v?->isLapsing() ?? false,
                'assignment_status' => $a?->status,            // null | assigned | submitted | reviewed
                'assignment_submitted_at' => optional($a?->submitted_at)->toIso8601String(),
            ];
        })->all();
    }

    /**
     * Dependants included in this case (children / partner / etc.), each with
     * their own documents. Sub-records of the case — no login.
     *
     * @return array<int, array<string, mixed>>
     */
    private function loadDependents(Lead $lead): array
    {
        return \App\Models\CaseDependent::where('lead_id', $lead->id)
            ->with(['documents' => fn ($q) => $q->orderByDesc('created_at')])
            ->orderBy('created_at')
            ->get()
            ->map(fn (\App\Models\CaseDependent $d) => array_merge([
                'id' => $d->id,
                'relationship' => $d->relationship,
                'family_name' => $d->family_name,
                'first_name' => $d->first_name,
                'middle_name' => $d->middle_name,
                'full_name' => $d->fullName(),
                'dob' => optional($d->dob)->toDateString(),
                'gender' => $d->gender,
                'nationality' => $d->nationality,
                'passport_number' => $d->passport_number,
                'passport_expiry' => optional($d->passport_expiry)->toDateString(),
                'source' => $d->source,
                'notes' => $d->notes,
            ], $d->checklistData()))->all();
    }

    private function dependentRules(): array
    {
        return [
            'relationship' => ['required', \Illuminate\Validation\Rule::in(\App\Models\CaseDependent::RELATIONSHIPS)],
            'first_name' => 'nullable|string|max:120',
            'family_name' => 'nullable|string|max:120',
            'middle_name' => 'nullable|string|max:120',
            'dob' => 'nullable|date',
            'gender' => 'nullable|string|max:20',
            'nationality' => 'nullable|string|max:100',
            'passport_number' => 'nullable|string|max:60',
            'passport_expiry' => 'nullable|date',
            'notes' => 'nullable|string|max:500',
        ];
    }

    /** Staff adds a dependant to the case. */
    public function addDependent(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);
        $data = $request->validate($this->dependentRules());

        \App\Models\CaseDependent::create(array_merge($data, [
            'lead_id' => $lead->id,
            'source' => 'staff',
            'added_by' => $user->id,
        ]));

        return back()->with('success', 'Dependant added to the case.');
    }

    /**
     * A case's applicant identity — used to pre-fill the Add-dependant form when
     * the dependant's details match an existing case. Guarded like any case view.
     */
    public function dependentSourceIdentity(Lead $lead)
    {
        $this->guardCase($lead);

        return response()->json([
            'first_name' => $lead->first_name,
            'family_name' => $lead->last_name,
            'middle_name' => $lead->middle_name,
            'dob' => optional($lead->dob)->toDateString(),
            'gender' => $lead->gender,
            'nationality' => $lead->citizenship ?: $lead->residence_country,
            'passport_number' => $lead->passport_number,
            'passport_expiry' => optional($lead->passport_expiry)->toDateString(),
        ]);
    }

    public function updateDependent(Request $request, Lead $lead, \App\Models\CaseDependent $dependent)
    {
        $this->guardCase($lead);
        abort_unless($dependent->lead_id === $lead->id, 404);
        $dependent->update($request->validate($this->dependentRules()));

        return back()->with('success', 'Dependant updated.');
    }

    public function deleteDependent(Lead $lead, \App\Models\CaseDependent $dependent)
    {
        $this->guardCase($lead);
        abort_unless($dependent->lead_id === $lead->id, 404);

        // Remove the dependant's document files, then the records.
        foreach ($dependent->documents as $doc) {
            if ($doc->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($doc->file_path)) {
                \Illuminate\Support\Facades\Storage::disk('local')->delete($doc->file_path);
            }
        }
        $dependent->documents()->delete();
        $dependent->delete();

        return back()->with('success', 'Dependant removed.');
    }

    /** Staff uploads a document for a specific dependant checklist item. */
    public function uploadDependentDocument(Request $request, Lead $lead, \App\Models\CaseDependent $dependent)
    {
        $user = $this->guardCase($lead);
        abort_unless($dependent->lead_id === $lead->id, 404);
        $data = $request->validate([
            'file' => 'required|file|max:20480', // 20 MB
            'checklist_key' => ['nullable', 'string', \Illuminate\Validation\Rule::in(\App\Services\Immigration\DependentChecklist::keys($dependent->relationship))],
        ]);

        $file = $request->file('file');
        $path = $file->store("lead-documents/{$lead->id}/dependents/{$dependent->id}", 'local');

        LeadDocument::create([
            'lead_id' => $lead->id,
            'dependent_id' => $dependent->id,
            'checklist_key' => $data['checklist_key'] ?? null,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'source' => 'dependent',
            'status' => 'Submitted',
            'uploaded_by' => $user->id,
        ]);

        return back()->with('success', 'Document uploaded for the dependant.');
    }

    /** Staff reviews a dependant's document (approve / reject / etc.). */
    public function setDependentDocumentStatus(Request $request, Lead $lead, \App\Models\CaseDependent $dependent, LeadDocument $document)
    {
        $user = $this->guardCase($lead);
        abort_unless($dependent->lead_id === $lead->id && $document->dependent_id === $dependent->id, 404);
        $data = $request->validate([
            'status' => ['required', \Illuminate\Validation\Rule::in(['Submitted', 'UnderReview', 'Approved', 'Rejected'])],
            'note' => 'nullable|string|max:500',
        ]);

        $document->forceFill([
            'status' => $data['status'],
            'note' => $data['note'] ?? $document->note,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ])->save();

        return back()->with('success', "Document marked {$data['status']}.");
    }

    public function deleteDependentDocument(Lead $lead, \App\Models\CaseDependent $dependent, LeadDocument $document)
    {
        $this->guardCase($lead);
        abort_unless($dependent->lead_id === $lead->id && $document->dependent_id === $dependent->id, 404);

        if ($document->file_path && \Illuminate\Support\Facades\Storage::disk('local')->exists($document->file_path)) {
            \Illuminate\Support\Facades\Storage::disk('local')->delete($document->file_path);
        }
        $document->delete();

        return back()->with('success', 'Document removed.');
    }

    /**
     * Generate a filled INZ form for the case. Fills the OFFICIAL current-version
     * PDF from case data, records the version filled against, and drops it on the
     * case as a DRAFT — never auto-filed (step-10 human check first).
     */
    public function generateInzForm(Request $request, Lead $lead, string $code)
    {
        $user = $this->guardCase($lead);

        $form = \App\Models\InzForm::where('code', $code)->firstOrFail();
        $version = $form->currentVersion();
        abort_unless($version, 422, "No current version registered for {$code}.");

        if (! $version->isReady()) {
            return back()->with('error', "No official PDF uploaded yet for {$code} ({$version->version_label}).");
        }

        // If the client filled this form in the portal, use their answers;
        // otherwise fill from case data.
        $assignment = \App\Models\CaseFormAssignment::where('lead_id', $lead->id)
            ->where('inz_form_id', $form->id)->where('status', 'submitted')->first();

        try {
            $filler = app(\App\Services\Immigration\InzFormFiller::class);
            $bytes = $assignment
                ? $filler->fillWithValues($version, $assignment->field_values ?? [])
                : $filler->fill($version, \App\Services\Immigration\InzCaseContext::for($lead));
        } catch (\Throwable $e) {
            Log::warning('INZ form fill failed', ['code' => $code, 'lead' => $lead->id, 'error' => $e->getMessage()]);

            return back()->with('error', $e->getMessage());
        }

        $path = "inz-generated/{$lead->id}/".\Illuminate\Support\Str::uuid().'.pdf';
        \Illuminate\Support\Facades\Storage::disk('local')->put($path, $bytes);

        LeadDocument::create([
            'lead_id' => $lead->id,
            'original_name' => "{$code} - {$form->name} ({$version->version_label}).pdf",
            'file_path' => $path,
            'mime' => 'application/pdf',
            'size' => strlen($bytes),
            'source' => 'generated',
            'source_variant' => "inz:{$code}",
            'inz_form_version_id' => $version->id,
            'status' => 'StaffShared',
            'uploaded_by' => $user->id,
            'note' => "Draft — INZ {$code} {$version->version_label}. Review before filing (step 10).",
        ]);

        // Generating from the client's answers marks the assignment reviewed.
        if ($assignment) {
            $assignment->forceFill(['status' => 'reviewed', 'reviewed_by' => $user->id, 'reviewed_at' => now()])->save();
        }

        return back()->with('success', "{$code} generated as a draft on the case. Review before filing.");
    }

    /**
     * Send an INZ form to the client to fill in the lead portal. Prefills the
     * mapped fields with what we already hold; the client completes/corrects.
     */
    public function assignInzForm(Request $request, Lead $lead, string $code)
    {
        $user = $this->guardCase($lead);
        $form = \App\Models\InzForm::where('code', $code)->firstOrFail();
        $version = $form->currentVersion();
        abort_unless($version, 422, "No current version for {$code}.");

        // Prefill [pdfField => value] from case data for the mapped fields.
        $filler = app(\App\Services\Immigration\InzFormFiller::class);
        $prefill = $filler->fieldValues($version, \App\Services\Immigration\InzCaseContext::for($lead));

        \App\Models\CaseFormAssignment::updateOrCreate(
            ['lead_id' => $lead->id, 'inz_form_id' => $form->id],
            [
                'inz_form_version_id' => $version->id,
                'status' => 'assigned',
                'field_values' => $prefill,
                'assigned_by' => $user->id,
                'submitted_at' => null,
                'reviewed_at' => null,
                'reviewed_by' => null,
            ],
        );

        return back()->with('success', "{$code} sent to the client to fill in their portal.");
    }

    /**
     * Build 12 phase 4 (§5) — "what changed since you last opened this". Reads
     * the viewer's previous CaseView (must be called BEFORE recording this open)
     * and the activity log after it. Deliberately carries no durations. Returns
     * null the first time a viewer opens the case (nothing to diff against).
     *
     * @return array{last_opened_at: string, changed_since: array<int, array<string, mixed>>}|null
     */
    private function buildAttention(Lead $lead, User $user): ?array
    {
        $previous = \App\Models\CaseView::lastOpenedBy($lead->id, $user->id);
        if (! $previous) {
            return null;
        }

        $changes = \App\Models\ActivityLog::query()
            ->where('properties->subject_type', 'Lead')
            ->where('properties->subject_id', $lead->id)
            ->where('created_at', '>', $previous->opened_at)
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($log) => [
                'id' => $log->id,
                'description' => $log->description,
                'actor_name' => $log->actor_name ?: 'System',
                'created_at' => optional($log->created_at)->toIso8601String(),
            ])
            ->all();

        return [
            'last_opened_at' => $previous->opened_at->toIso8601String(),
            'changed_since' => $changes,
        ];
    }

    /**
     * Every thread on the case (Build 12 phase 6, §7). Open first, then resolved
     * for the trail. Placement is the frontend's job, derived from the anchor —
     * a document thread renders on its document row, a step thread on its step,
     * case/gate/stage threads in the Notes tab.
     *
     * @return array<int, array<string, mixed>>
     */
    private function loadThreads(Lead $lead): array
    {
        return \App\Models\CaseThread::query()
            ->where('lead_id', $lead->id)
            ->with(['author:id,name', 'addressedTo:id,name', 'resolver:id,name'])
            ->orderByRaw('resolved_at IS NULL DESC')
            ->orderByDesc('id')
            ->get()
            ->map(fn (\App\Models\CaseThread $t) => [
                'id' => $t->id,
                'anchor_type' => $t->anchor_type,
                'anchor_id' => $t->anchor_id,
                'anchor_key' => $t->anchor_key,
                'anchor_attempt' => $t->anchor_attempt,
                'body' => $t->body,
                'requires_answer' => $t->requires_answer,
                'author' => $t->author?->name,
                'addressed_to' => $t->addressedTo ? ['id' => $t->addressedTo->id, 'name' => $t->addressedTo->name] : null,
                'resolved_at' => optional($t->resolved_at)->toIso8601String(),
                'resolved_by' => $t->resolver?->name,
                'created_at' => optional($t->created_at)->toIso8601String(),
            ])
            ->all();
    }

    /** Immigration-capable staff a thread can be addressed to. */
    private function loadCaseStaff(): array
    {
        return User::query()
            ->whereIn('role', array_merge(
                [User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN, 'immigration'],
                User::IMMIGRATION_ROLES,
            ))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
            ->all();
    }

    /**
     * The last stored findings evaluation for the case (Build 12 phase 3).
     * Open findings only, worst severity first; plus the run's timestamp and
     * the required "couldn't verify" list. Never triggers an evaluation.
     *
     * @return array{items: array, evaluated_at: ?string, couldnt_verify: array}
     */
    private function loadFindings(Lead $lead): array
    {
        $order = ['blocking' => 0, 'check' => 1, 'info' => 2];

        $items = \App\Models\CaseFinding::query()
            ->where('lead_id', $lead->id)
            ->where('status', \App\Models\CaseFinding::STATUS_OPEN)
            ->get()
            ->sortBy(fn ($f) => [$order[$f->severity] ?? 9, $f->first_seen_at?->timestamp ?? 0])
            ->values()
            ->map(fn (\App\Models\CaseFinding $f) => [
                'id' => $f->id,
                'finding_key' => $f->finding_key,
                'category' => $f->category,
                'severity' => $f->severity,
                'title' => $f->title,
                'detail' => $f->detail,
                'evidence' => $f->evidence ?? [],
                'source' => $f->source,
                'audience' => $f->audience,
                'first_seen_at' => optional($f->first_seen_at)->toIso8601String(),
                'last_seen_at' => optional($f->last_seen_at)->toIso8601String(),
            ]);

        $run = \App\Models\CaseFindingRun::where('lead_id', $lead->id)->first();

        return [
            'items' => $items,
            'evaluated_at' => optional($run?->evaluated_at)->toIso8601String(),
            'couldnt_verify' => $run?->couldnt_verify ?? [],
        ];
    }

    /**
     * Dismiss a finding with a required reason (Build 12 phase 3). Persists —
     * a dismissed finding stays dismissed even if the rule fires again, so the
     * dismissal rate per finding_key is how the rules get tuned.
     */
    public function dismissFinding(Request $request, Lead $lead, \App\Models\CaseFinding $finding)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);
        abort_unless($finding->lead_id === $lead->id, 404);

        $data = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $finding->update([
            'status' => \App\Models\CaseFinding::STATUS_DISMISSED,
            'dismiss_reason' => $data['reason'],
            // Scope the dismissal to the current situation — a later evaluation
            // with different stable evidence re-opens it.
            'dismissed_fingerprint' => \App\Models\CaseFinding::fingerprintFor($finding->evidence),
            'actioned_by' => $user->id,
            'actioned_at' => now(),
        ]);

        return back()->with('success', 'Finding dismissed.');
    }

    /**
     * Dismiss a whole rule's findings at once (Build 12 phase 3 refinement). The
     * panel collapses repeated same-rule findings (e.g. 18 checklist items) into
     * one summary row with a single dismiss — but dismissal stays PER ITEM here:
     * each finding is dismissed individually with its own evidence fingerprint,
     * so dedup, auto-resolve and evidence-scoped re-open all keep working exactly
     * as they do for a single finding. The grouping is presentation-only; this is
     * just a loop over the group's members.
     */
    public function dismissFindingGroup(Request $request, Lead $lead)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);

        $data = $request->validate([
            'prefix' => 'required|string|max:40',
            'reason' => 'required|string|max:500',
        ]);

        // Only rules that emit one finding PER ITEM are groupable — an
        // arbitrary prefix must not become a mass-dismiss lever.
        $groupable = ['checklist_missing', 'doc_rejected', 'doc_request_unanswered', 'overdue_step', 'thread_unanswered'];
        abort_unless(in_array($data['prefix'], $groupable, true), 422, 'That finding type cannot be dismissed as a group.');

        $now = now();
        $findings = \App\Models\CaseFinding::where('lead_id', $lead->id)
            ->where('status', \App\Models\CaseFinding::STATUS_OPEN)
            ->where('finding_key', 'like', $data['prefix'].':%')
            ->get();

        foreach ($findings as $finding) {
            $finding->update([
                'status' => \App\Models\CaseFinding::STATUS_DISMISSED,
                'dismiss_reason' => $data['reason'],
                // Per-item fingerprint — a later evaluation with different stable
                // evidence re-opens that item on its own.
                'dismissed_fingerprint' => \App\Models\CaseFinding::fingerprintFor($finding->evidence),
                'actioned_by' => $user->id,
                'actioned_at' => $now,
            ]);
        }

        return back()->with('success', $findings->count().' findings dismissed.');
    }

    /**
     * Manually queue a re-evaluation (Build 12 phase 3). The panel still renders
     * the last stored result; this refreshes it off the request path.
     */
    public function reevaluateFindings(Request $request, Lead $lead)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);

        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', 'Re-checking the case — findings will refresh shortly.');
    }

    // ── Process chain (Build 12 phase 4.5) ──────────────────────────────────

    /**
     * The case's step chain for the Process panel — each template step decorated
     * with its current (highest-attempt) state, owner, due/overdue, plus the
     * payment and partner-fork records. `started=false` when no chain exists yet.
     *
     * @return array<string, mixed>
     */
    private function loadProcess(Lead $lead): array
    {
        $states = app(\App\Services\Immigration\CaseStepService::class)->currentStates($lead);

        if ($states->isEmpty()) {
            return ['started' => false, 'steps' => [], 'payment' => null, 'partner' => null];
        }

        $owners = User::whereIn('id', $states->pluck('owner_user_id')->filter()->unique())
            ->get(['id', 'name', 'avatar_path'])->keyBy('id');

        $steps = \App\Models\CaseStepTemplate::chain()->map(function ($t) use ($states, $owners) {
            $st = $states->get($t->step_key);
            $owner = $st && $st->owner_user_id ? $owners->get($st->owner_user_id) : null;

            return [
                'step_key' => $t->step_key,
                'label' => $t->label,
                'owner_role' => $t->owner_role,
                'stage' => $t->stage,
                'gate' => $t->gate,
                'is_qc' => $t->is_qc,
                'channels_required' => $t->channels_required,
                'depends_on' => $t->depends_on ?? [],
                'status' => $st->status ?? 'pending',
                'attempt' => $st->attempt ?? 1,
                'due_at' => optional($st->due_at)->toIso8601String(),
                'overdue' => $st && $st->status === \App\Models\CaseStepState::STATUS_ACTIVE
                    && $st->due_at && $st->due_at->isPast(),
                'completed_at' => optional($st->completed_at)->toIso8601String(),
                'qc_result' => $st->qc_result,
                'reactivation_trigger' => $st->reactivation_trigger,
                'owner' => $owner ? ['id' => $owner->id, 'name' => $owner->name, 'avatar_url' => $owner->avatar_url] : null,
            ];
        })->values();

        $payment = \App\Models\CasePayment::where('lead_id', $lead->id)->latest('id')->first();
        $partner = \App\Models\CasePartnerRecommendation::where('lead_id', $lead->id)->latest('id')->first();

        return [
            'started' => true,
            'steps' => $steps,
            'payment' => $payment ? [
                'amount_expected' => (float) $payment->amount_expected,
                'amount_received' => (float) $payment->amount_received,
                'status' => $payment->status,
                'method' => $payment->method,
                'received_at' => optional($payment->received_at)->toDateString(),
            ] : null,
            'partner' => $partner ? [
                'recommended_main_applicant' => $partner->recommended_main_applicant,
                'recommendation_reason' => $partner->recommendation_reason,
                'client_choice' => $partner->client_choice,
                'choice_document_id' => $partner->choice_document_id,
                'resolved' => $partner->isResolved(),
            ] : null,
            // Build 12 phase 5 — verdict + lodgement sign-off state, and whether
            // the current user may attest (holds a current licence).
            'verdict' => ($v = \App\Models\CaseAttestation::currentVerdict($lead->id)) ? [
                'verdict' => $v->verdict,
                'reason' => $v->reason,
                'adviser' => optional($v->adviser)->name,
                'at' => optional($v->created_at)->toIso8601String(),
            ] : null,
            'has_lodgement_signoff' => \App\Models\CaseAttestation::hasLodgementSignoff($lead->id),
            'can_attest' => (bool) optional(auth()->user())->holdsCurrentLicence(),
        ];
    }

    /**
     * Record a case verdict (Build 12 phase 5). Licence-gated through
     * AdviceBearingPolicy — an unlicensed or lapsed user is refused before any
     * row is written. The verdict is the write; the case's movement (advance /
     * bounce-back / hold) is a consequence, handled by VerdictService.
     */
    public function recordVerdict(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('approve-advice-bearing');

        $data = $request->validate([
            'verdict' => ['required', \Illuminate\Validation\Rule::in(\App\Models\CaseAttestation::VERDICTS)],
            'reason' => 'nullable|string|max:2000',
            'step_key' => 'nullable|string|max:20', // for needs_something
        ]);

        app(\App\Services\Immigration\VerdictService::class)
            ->recordVerdict($lead, $data['verdict'], $data['reason'] ?? null, $user, $data['step_key'] ?? null);

        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', 'Verdict recorded.');
    }

    /**
     * Record the adviser's lodgement sign-off (Build 12 phase 5). Licence-gated.
     * This — not the mechanical upload — is what completes step 12.
     */
    public function recordLodgementSignoff(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);
        \Illuminate\Support\Facades\Gate::forUser($user)->authorize('approve-advice-bearing');

        $data = $request->validate(['reason' => 'nullable|string|max:2000']);

        app(\App\Services\Immigration\VerdictService::class)
            ->recordLodgementSignoff($lead, $user, $data['reason'] ?? null);

        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', 'Lodgement signed off.');
    }

    // ── Threads (Build 12 phase 6, §7) ──────────────────────────────────────

    /**
     * Open a thread on the case. NOT a chat message — it must anchor to
     * something (the case, a document, a gate, a stage, or a step) or it is
     * refused. A document anchor must name a document ON THIS CASE; a step / gate
     * / stage anchor must carry its key. An answer-requiring thread addressed to
     * someone notifies them the same way a handoff does (phase 2).
     */
    public function storeThread(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'anchor_type' => ['required', \Illuminate\Validation\Rule::in(\App\Models\CaseThread::ANCHOR_TYPES)],
            // document → an id on this case; step/gate/stage → a key.
            'anchor_id' => ['nullable', 'integer', 'required_if:anchor_type,document'],
            'anchor_key' => ['nullable', 'string', 'max:60', 'required_if:anchor_type,step', 'required_if:anchor_type,gate', 'required_if:anchor_type,stage'],
            'anchor_attempt' => ['nullable', 'integer', 'min:1'],
            'body' => ['required', 'string', 'max:2000'],
            'addressed_to_id' => ['nullable', 'integer', 'exists:users,id'],
            'requires_answer' => ['boolean'],
        ]);

        // A document anchor must reference a document that belongs to this case —
        // row-level, not just "some document id" (§13).
        if ($data['anchor_type'] === \App\Models\CaseThread::ANCHOR_DOCUMENT) {
            abort_unless(
                LeadDocument::where('id', $data['anchor_id'])->where('lead_id', $lead->id)->exists(),
                422,
                'That document is not on this case.'
            );
        }

        $thread = \App\Models\CaseThread::create([
            'lead_id' => $lead->id,
            'anchor_type' => $data['anchor_type'],
            'anchor_id' => $data['anchor_type'] === \App\Models\CaseThread::ANCHOR_DOCUMENT ? $data['anchor_id'] : null,
            'anchor_key' => in_array($data['anchor_type'], ['step', 'gate', 'stage'], true) ? ($data['anchor_key'] ?? null) : null,
            'anchor_attempt' => $data['anchor_type'] === \App\Models\CaseThread::ANCHOR_STEP ? ($data['anchor_attempt'] ?? null) : null,
            'author_id' => $user->id,
            'addressed_to_id' => $data['addressed_to_id'] ?? null,
            'body' => $data['body'],
            'requires_answer' => (bool) ($data['requires_answer'] ?? false),
        ]);

        // Answer-requiring + addressed → it lands in that person's queue, and we
        // tell them, exactly like a handoff. Don't notify yourself.
        if ($thread->requires_answer && $thread->addressed_to_id && $thread->addressed_to_id !== $user->id) {
            User::find($thread->addressed_to_id)?->notify(
                new \App\Notifications\CaseThreadAddressed($thread->load('lead'), $user->name)
            );
        }

        return back()->with('success', 'Thread posted.');
    }

    /**
     * Mark a thread answered (Build 12 phase 6). Explicit and recorded
     * (resolved_at / resolved_by) — nothing is deleted. Resolving clears it from
     * the addressee's queue and lets the finding auto-resolve on the next run.
     */
    public function resolveThread(Request $request, Lead $lead, \App\Models\CaseThread $thread)
    {
        $user = $this->guardCase($lead);
        abort_unless($thread->lead_id === $lead->id, 404);

        if (! $thread->isResolved()) {
            $thread->forceFill(['resolved_at' => now(), 'resolved_by' => $user->id])->save();
            \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);
        }

        return back()->with('success', 'Thread resolved.');
    }

    /** Start (instantiate) the step chain for a case. */
    public function startProcess(Request $request, Lead $lead)
    {
        $this->guardCase($lead);
        app(\App\Services\Immigration\CaseStepService::class)->instantiate($lead);

        return back()->with('success', 'Process tracking started.');
    }

    /**
     * Complete a step. QC steps carry a pass/fail result and 3-channel steps the
     * channels done — both procedural, so NO licence gate (QC is not advice).
     */
    public function completeStep(Request $request, Lead $lead, string $step)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'qc_result' => ['nullable', \Illuminate\Validation\Rule::in(['pass', 'fail'])],
            'channels' => 'nullable|array',
        ]);

        app(\App\Services\Immigration\CaseStepService::class)->complete($lead, $step, $user, $data);
        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', "Step {$step} completed.");
    }

    /** Re-enter a completed step as a new attempt (RFI, rejected doc, manual). */
    public function reactivateStep(Request $request, Lead $lead, string $step)
    {
        $this->guardCase($lead);

        $data = $request->validate([
            'trigger' => ['required', \Illuminate\Validation\Rule::in(['rfi', 'doc_rejected', 'verdict_needs_something', 'manual'])],
            'reason' => 'nullable|string|max:500',
        ]);

        app(\App\Services\Immigration\CaseStepService::class)->reactivate($lead, $step, $data['trigger'], $data['reason'] ?? null);
        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', "Step {$step} re-opened ({$data['trigger']}).");
    }

    /** Record a payment against the case (§15.5) — status derived from amounts. */
    public function recordPayment(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'amount_expected' => 'required|numeric|min:0',
            'amount_received' => 'required|numeric|min:0',
            'method' => 'nullable|string|max:40',
            'received_at' => 'nullable|date',
        ]);

        \App\Models\CasePayment::create([
            'lead_id' => $lead->id,
            'amount_expected' => $data['amount_expected'],
            'amount_received' => $data['amount_received'],
            'status' => \App\Models\CasePayment::deriveStatus((float) $data['amount_expected'], (float) $data['amount_received']),
            'method' => $data['method'] ?? null,
            'received_at' => $data['received_at'] ?? now(),
            'recorded_by' => $user->id,
        ]);

        \App\Jobs\EvaluateCaseFindings::dispatch($lead->id);

        return back()->with('success', 'Payment recorded.');
    }

    /**
     * Partner-visa fork (§15.6). Recommending the main applicant is ADVICE —
     * licence-gated. Recording the client's written choice is procedural.
     */
    public function partnerRecommendation(Request $request, Lead $lead)
    {
        $user = $this->guardCase($lead);

        $data = $request->validate([
            'recommended_main_applicant' => 'nullable|string|max:160',
            'recommendation_reason' => 'nullable|string|max:1000',
            'client_choice' => 'nullable|string|max:160',
            'choice_document_id' => 'nullable|integer|exists:lead_documents,id',
        ]);

        // The recommendation is advice — only a licensed adviser may author it.
        if (filled($data['recommended_main_applicant']) && ! $user->holdsCurrentLicence()) {
            return back()->withErrors(['error' => 'Only a licensed adviser may recommend the main applicant.']);
        }

        $rec = \App\Models\CasePartnerRecommendation::firstOrNew(['lead_id' => $lead->id]);
        $rec->fill(array_filter($data, fn ($v) => $v !== null));
        $rec->recorded_by = $user->id;
        $rec->decided_at = filled($data['client_choice']) ? now() : $rec->decided_at;
        $rec->save();

        // Once the client has chosen in writing, the fork (step 06a) is done —
        // completing it advances the chain past the gate at step 06.
        $svc = app(\App\Services\Immigration\CaseStepService::class);
        $forkState = $svc->currentStates($lead)->get('06a');
        if ($rec->isResolved() && $forkState && $forkState->status === \App\Models\CaseStepState::STATUS_ACTIVE) {
            $svc->complete($lead, '06a', $user);
        }

        return back()->with('success', 'Partner recommendation saved.');
    }

    /** Shared case guard for the process endpoints. */
    private function guardCase(Lead $lead): User
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);

        return $user;
    }

    /** POST /portal/immigration/cases/{lead}/personal — edit the applicant's
     *  personal details from the Case Profile "Personal" tab. */
    public function updatePersonal(Request $request, Lead $lead)
    {
        $user = auth()->user();
        abort_unless($user instanceof User, 403);
        $this->ensureCanViewCases($user);
        abort_unless($lead->is_immigration_case, 404);

        $validated = $request->validate([
            'first_name' => 'required|string|max:120',
            'middle_name' => 'nullable|string|max:120',
            'last_name' => 'nullable|string|max:120',
            'suffix' => 'nullable|string|max:20',
            'gender' => 'nullable|string|max:40',
            'marital_status' => 'nullable|string|max:40',
            'dob' => 'nullable|date',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:40',
            'citizenship' => 'nullable|string|max:120',
            'residence_country' => 'nullable|string|max:120',
            'passport_number' => 'nullable|string|max:60',
            'passport_expiry' => 'nullable|date',
        ]);

        $lead->update($validated);

        return back()->with('success', 'Personal details updated.');
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
                'lead_id' => $lead->id,
                'viewer_id' => $user->id,
                'viewer_name' => $user->name,
                'viewer_role' => $user->role,
                'action' => 'view',
                'context' => 'case_profile',
                'ip' => request()->ip(),
                'viewed_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Case profile audit view write failed', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * The case's Visa Information Form (official assessment PDF), available in
     * Documents when the case took a work/student/visitor assessment. Points at
     * the existing on-demand VIF exports (always reflects the latest intake),
     * so nothing is stored/duplicated.
     *
     * @param  array<string, mixed>|null  $intake
     * @return array<string, mixed>|null
     */
    private function resolveVif(?string $type, ?array $intake): ?array
    {
        if (! $type || ! in_array($type, ['work', 'student', 'visitor'], true) || empty($intake['id'])) {
            return null; // resident intakes / sales-converted cases have no VIF
        }
        $id = $intake['id'];

        return [
            'type' => $type,
            'id' => $id,
            'preview_url' => "/portal/immigration/intakes/{$type}/{$id}/preview",
            'pdf_url' => "/portal/immigration/intakes/{$type}/{$id}/pdf",
            'word_url' => "/portal/immigration/intakes/{$type}/{$id}/word",
        ];
    }

    /**
     * Cases have two origin paths (see audit Section 6):
     *   1. Sales-converted via LeadController::convertToCase — no intake row, returns [null, null]
     *   2. Assessment-converted via Portal\ImmigrationController::convertAssessmentToCase —
     *      a polymorphic Assessment row paired with one of resident/work/student/visitor
     *      intakes. Linked to the Lead via `leads.assessment_id` (stamped at
     *      conversion); older cases fall back to a name-aware email match.
     *
     * Returns [type, intakeArray] where type is 'resident'|'work'|'student'|'visitor'|null.
     */
    protected function resolveIntake(Lead $lead): array
    {
        $assessment = null;

        // 1. Authoritative link, stamped at conversion time — the case points
        //    at the EXACT assessment it came from.
        if ($lead->assessment_id) {
            $assessment = Assessment::whereNotNull('intakeable_type')->find($lead->assessment_id);
        }

        $wantLast = strtolower(trim((string) $lead->last_name));
        $wantFirst = strtolower(trim((string) $lead->first_name));

        // 2. Legacy fallback (cases converted before the FK existed): match by
        //    email, but prefer the assessment whose intake name matches this
        //    lead — email alone is ambiguous when applicants share one.
        if (! $assessment && $lead->email) {
            $candidates = Assessment::where('applicant_email', $lead->email)
                ->whereNotNull('intakeable_type')
                ->latest('id')
                ->get();

            $assessment = $candidates->first(function ($a) use ($wantLast, $wantFirst) {
                $i = $a->intakeable;
                if (! $i) {
                    return false;
                }
                $iLast = strtolower(trim((string) ($i->last_name ?? $i->family_name ?? '')));
                $iFirst = strtolower(trim((string) ($i->first_name ?? '')));

                return $wantLast !== '' && $iLast === $wantLast && ($wantFirst === '' || $iFirst === $wantFirst);
            });
        }

        // 3. Name match — covers a case with no email (or no email match),
        //    e.g. a staff-created case. Uses the assessment's own applicant
        //    name and only links when the match is unambiguous.
        if (! $assessment && $wantFirst !== '' && $wantLast !== '') {
            $byName = Assessment::whereNotNull('intakeable_type')
                ->whereRaw('LOWER(TRIM(applicant_last_name)) = ?', [$wantLast])
                ->whereRaw('LOWER(TRIM(applicant_first_name)) = ?', [$wantFirst])
                ->latest('id')
                ->get();

            if ($byName->count() === 1) {
                $assessment = $byName->first();
            }
        }

        if (! $assessment) {
            return [null, null];
        }

        $intake = $assessment->intakeable;
        if (! $intake) {
            return [null, null];
        }

        $type = match ($intake::class) {
            ResidentIntake::class => 'resident',
            WorkIntake::class => 'work',
            StudentIntake::class => 'student',
            VisitorIntake::class => 'visitor',
            default => null,
        };

        if ($type === null) {
            return [null, null];
        }

        return [$type, array_merge($intake->toArray(), [
            'assessment_id' => $assessment->id,
            'assessment_status' => $assessment->status,
            'assessment_payment_status' => $assessment->payment_status,
            'assessment_booking_id' => $assessment->booking_id,
        ])];
    }

    private function serializeLead(Lead $lead): array
    {
        $lead->loadMissing(['assignee:id,name,email,role', 'faceImage']);

        return [
            'id' => $lead->id,
            'lead_id' => $lead->lead_id,
            // Applicant's uploaded Face image — same profile picture the
            // cases list and the client's tracker show.
            'avatar_url' => $lead->faceImageUrl(),
            'first_name' => $lead->first_name,
            'middle_name' => $lead->middle_name,
            'last_name' => $lead->last_name,
            'suffix' => $lead->suffix,
            'gender' => $lead->gender,
            'marital_status' => $lead->marital_status,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'dob' => optional($lead->dob)->format('Y-m-d'),
            'citizenship' => $lead->citizenship,
            'residence_country' => $lead->residence_country,
            'passport_number' => $lead->passport_number,
            'passport_expiry' => optional($lead->passport_expiry)->format('Y-m-d'),
            'tracking_code' => $lead->tracking_code,
            'status' => $lead->status,
            'stage' => $lead->stage,
            'immigration_stage' => $lead->immigration_stage,
            'inz_visa_type' => $lead->inz_visa_type,
            'inz_reference' => $lead->inz_reference,
            'inz_status' => $lead->inz_status,
            'inz_lodged_at' => $lead->inz_lodged_at,
            'inz_decision_at' => $lead->inz_decision_at,
            'is_immigration_case' => (bool) $lead->is_immigration_case,
            'immigration_converted_at' => $lead->immigration_converted_at,
            'immigration_converted_by' => $lead->immigration_converted_by,
            'source' => $lead->source,
            'assignee' => $lead->assignee,
            'is_assessment_converted' => $this->wasAssessmentConverted($lead),
        ];
    }

    /**
     * "Came from assessment" vs "came from sales". A sales-converted case has
     * no Assessment row at the lead's email; an assessment-converted case does.
     */
    private function wasAssessmentConverted(Lead $lead): bool
    {
        if ($lead->assessment_id) {
            return true;
        }
        if (! $lead->email) {
            return false;
        }

        return Assessment::where('applicant_email', $lead->email)->exists();
    }

    private function loadDocuments(Lead $lead): array
    {
        return LeadDocument::where('lead_id', $lead->id)
            ->whereNull('dependent_id') // dependants' docs live under the Family tab
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (LeadDocument $d) => [
                'id' => $d->id,
                'checklist_key' => $d->checklist_key,
                'original_name' => $d->original_name,
                'mime' => $d->mime,
                'size' => $d->size,
                'status' => $d->status,
                'source' => $d->source,
                'source_variant' => $d->source_variant,
                'note' => $d->note,
                'reviewed_at' => $d->reviewed_at,
                'created_at' => $d->created_at,
            ])
            ->all();
    }

    // (loadVisaChecklist was here in Phase 1; Phase 4 moved it into
    // App\Services\Immigration\CaseChecklistService so the resolution
    // logic is testable in isolation and reusable by the optional
    // refresh endpoint below.)

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
                'id' => $row->id,
                'channel' => $row->channel,
                'subject' => $row->subject,
                'snippet' => $this->snippet($row->body),
                'status' => $row->status,
                'recipient_address' => $row->recipient_address,
                'sent_at' => $row->sent_at,
                'failed_at' => $row->failed_at,
                'created_at' => $row->created_at,
            ])
            ->all();
    }

    private function snippet(?string $body): string
    {
        if (! $body) {
            return '';
        }
        $plain = trim(strip_tags($body));

        return mb_strlen($plain) > 160 ? mb_substr($plain, 0, 160).'…' : $plain;
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
                'id' => $a->id,
                'title' => $a->title,
                'status' => $a->status,
                'template' => $a->template
                    ? ['id' => $a->template->id, 'name' => $a->template->name, 'visa_type' => $a->template->visa_type]
                    : null,
                'generated_by' => $a->generatedBy?->name,
                'sent_at' => $a->sent_at,
                'viewed_at' => $a->viewed_at,
                'signed_at' => $a->signed_at,
                'signer_name' => $a->signer_name,
                'signer_ip' => $a->signer_ip,
                'signer_user_agent' => $a->signer_user_agent,
                'has_pdf' => (bool) $a->pdf_path,
                'has_signed_pdf' => (bool) $a->signed_pdf_path,
                'tracker_signing_token' => $a->tracker_signing_token,
                'created_at' => $a->created_at,
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
                'id' => $n->id,
                'body' => $n->body,
                'pinned' => (bool) ($n->pinned ?? false),
                'author' => $n->author_name ?? null,
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
                'id' => $log->id,
                'action' => $log->action,
                'description' => $log->description,
                'actor_name' => $log->actor_name ?: 'System',
                'actor_role' => $log->actor_role ?: 'public',
                'created_at' => $log->created_at,
            ])
            ->all();
    }
}
