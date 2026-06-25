<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\AddNoteRequest;
use App\Http\Requests\Onboarding\AssignRequest;
use App\Http\Requests\Onboarding\ConvertToTenantRequest;
use App\Http\Requests\Onboarding\LinkPropertyRequest;
use App\Http\Requests\Onboarding\UpdateStatusRequest;
use App\Models\EoiSubmission;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OnboardingTransitionService;
use App\Support\OnboardingPipeline;
use Illuminate\Http\Request;

class EoiSubmissionController extends Controller
{
    /** Kept for backwards compatibility; the pipeline is the source of truth now. */
    public const STATUSES = ['new', 'reviewed', 'shortlisted', 'declined'];

    public function index(Request $request)
    {
        $view = $request->query('view') === 'pipeline' ? 'pipeline' : 'table';

        $shared = [
            'view' => $view,
            'filters' => $request->only([
                'search', 'status', 'form_type', 'lead_temperature',
                'assigned_to', 'property_id', 'active_pipeline', 'days_at_stage_min', 'sort',
            ]),
            'options' => $this->options(),
        ];

        if ($view === 'pipeline') {
            // Whole board (incl. terminal states), capped — grouped client-side.
            $board = $this->filteredQuery($request, forBoard: true)
                ->with(['property', 'assignedTo', 'convertedTenant'])
                ->limit(500)
                ->get()
                ->each(fn (EoiSubmission $s) => $s->property?->makeVisible(['code', 'address']));

            return inertia('portal/accommodation/Applications', array_merge($shared, ['board' => $board]));
        }

        $submissions = $this->filteredQuery($request)
            ->with(['property', 'assignedTo', 'convertedTenant'])
            ->paginate(15)
            ->withQueryString()
            ->through(function (EoiSubmission $s) {
                $s->property?->makeVisible(['code', 'address']);

                return $s;
            });

        return inertia('portal/accommodation/Applications', array_merge($shared, ['submissions' => $submissions]));
    }

    public function show(EoiSubmission $submission)
    {
        $submission->load(['property', 'assignedTo', 'convertedTenant']);
        // address/code for display; internet_passcode + house_code feed the
        // move-in welcome email preview (staff-only portal page).
        $submission->property?->makeVisible(['code', 'address', 'internet_passcode', 'house_code']);

        return inertia('portal/accommodation/ApplicationDetails', [
            'submission' => $submission,
            'options' => $this->options(),
            'allowedTransitions' => OnboardingPipeline::allowedFrom($submission->status),
        ]);
    }

    public function updateStatus(UpdateStatusRequest $request, EoiSubmission $submission, OnboardingTransitionService $service)
    {
        // Reaching moved_in creates a Tenant, which needs contract data — that
        // goes through the dedicated Convert to Tenant flow, not a bare status flip.
        if ($request->input('status') === 'moved_in') {
            return redirect()->back()->with('error', 'Use “Convert to Tenant” to complete move-in.');
        }

        $service->transition($submission, $request->input('status'), $request->stageData());

        return redirect()->back()->with('success', 'Stage updated.');
    }

    public function assignTo(AssignRequest $request, EoiSubmission $submission)
    {
        $submission->update(['assigned_to_user_id' => $request->input('user_id')]);

        // NOTE: assignee notification is deferred until the messaging system exists.

        return redirect()->back()->with('success', 'Assigned.');
    }

    public function linkToProperty(LinkPropertyRequest $request, EoiSubmission $submission)
    {
        $property = Property::findOrFail($request->input('property_id'));

        $submission->property_id = $property->id;
        // Backfill the legacy free-text field if it was empty.
        if (empty($submission->property_interested)) {
            $submission->property_interested = $property->address ?: $property->name;
        }
        $submission->save();

        return redirect()->back()->with('success', 'Linked to property.');
    }

    public function addInternalNote(AddNoteRequest $request, EoiSubmission $submission)
    {
        $stamp = '['.now()->toDateTimeString().'] '.$request->input('note');
        $submission->internal_notes = $submission->internal_notes
            ? trim($submission->internal_notes)."\n".$stamp
            : $stamp;
        $submission->save();

        return redirect()->back()->with('success', 'Note added.');
    }

    public function convertToTenant(ConvertToTenantRequest $request, EoiSubmission $submission)
    {
        if (! in_array($submission->status, ['payment_confirmed', 'moved_in'], true)) {
            return redirect()->back()->with('error', 'Conversion is only available once payment is confirmed.');
        }

        if ($submission->converted_to_tenant_id) {
            return redirect()->back()->with('error', 'This applicant has already been converted to a tenant.');
        }

        $data = $request->validated();

        $tenant = Tenant::create([
            'property_id' => $data['property_id'],
            'unit' => $data['unit'] ?? null,
            'first_name' => $data['first_name'],
            'family_name' => $data['family_name'],
            'display_name_override' => $data['display_name_override'] ?? null,
            'email' => $data['email'] ?? $submission->email,
            'phone' => $data['phone'] ?? $submission->mobile,
            'nationality' => $submission->nationality,
            'contract_type' => $data['contract_type'],
            'contract_start' => $data['contract_start'],
            'contract_end' => $data['contract_end'] ?? null,
            'weekly_rent_nzd' => $data['weekly_rent_nzd'] ?? null,
            'weekly_utilities_nzd' => $data['weekly_utilities_nzd'] ?? null,
            'bond_paid_nzd' => $data['bond_paid_nzd'] ?? null,
            'advance_paid_nzd' => $data['advance_paid_nzd'] ?? null,
            'current_status' => 'active',
            'converted_from_viewer_id' => $submission->id, // activates the Tenants-build placeholder
            'notes' => $data['notes'] ?? "Converted from EOI submission #{$submission->id}",
        ]);

        $submission->converted_to_tenant_id = $tenant->id;
        $submission->status = 'moved_in';
        $submission->move_in_date = $submission->move_in_date ?: $data['contract_start'];
        $submission->save();

        return redirect()->route('portal.accommodation.tenants.show', $tenant)
            ->with('success', "Converted to tenant — {$tenant->display_name} is now active.");
    }

    public function destroy(EoiSubmission $submission)
    {
        if (! in_array($submission->status, OnboardingPipeline::TERMINALS, true)) {
            return redirect()->back()
                ->with('error', 'Only declined or not-proceeding applications can be deleted.');
        }

        $submission->delete(); // soft delete

        return redirect()->route('portal.accommodation.applications.index')
            ->with('success', 'Application removed.');
    }

    // ---- Helpers ----------------------------------------------------------

    private function filteredQuery(Request $request, bool $forBoard = false)
    {
        $search = $request->query('search');
        $status = $request->query('status');
        $formType = $request->query('form_type');
        $temperature = $request->query('lead_temperature');
        $assigned = $request->query('assigned_to');
        $propertyId = $request->query('property_id');
        $daysMin = $request->query('days_at_stage_min');

        $query = EoiSubmission::query()
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('full_legal_name', 'like', "%{$search}%")
                ->orWhere('preferred_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('mobile', 'like', "%{$search}%")))
            ->when(OnboardingPipeline::isValidStatus((string) $status), fn ($q) => $q->where('status', $status))
            ->when(in_array($formType, ['hot', 'cold'], true), fn ($q) => $q->where('form_type', $formType))
            ->when(in_array($temperature, ['hot', 'cold'], true), fn ($q) => $q->where('lead_temperature', $temperature))
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->when($assigned === 'me', fn ($q) => $q->where('assigned_to_user_id', $request->user()?->id))
            ->when($assigned === 'unassigned', fn ($q) => $q->whereNull('assigned_to_user_id'))
            ->when($assigned && ! in_array($assigned, ['me', 'unassigned'], true), fn ($q) => $q->where('assigned_to_user_id', $assigned))
            ->when($daysMin !== null && $daysMin !== '', fn ($q) => $q->where('updated_at', '<=', now()->subDays((int) $daysMin)));

        // Table view defaults to active-pipeline-only; the board shows everything.
        if (! $forBoard && $request->query('active_pipeline', '1') !== '0') {
            $query->inActivePipeline();
        }

        return $this->applySort($query, $request->query('sort'));
    }

    private function applySort($query, ?string $sort)
    {
        if ($sort === 'days_at_stage') {
            return $query->orderBy('updated_at', 'asc'); // oldest update = most stalling
        }

        if ($sort === 'stage_order') {
            $cases = collect(OnboardingPipeline::STAGES)
                ->map(fn ($s, $i) => "WHEN '".$s."' THEN ".$i)
                ->implode(' ');

            return $query->orderByRaw("CASE status {$cases} ELSE 999 END");
        }

        return $query->latest();
    }

    private function options(): array
    {
        return [
            'stages' => OnboardingPipeline::STAGES,
            'terminals' => OnboardingPipeline::TERMINALS,
            'statuses' => OnboardingPipeline::allStatuses(),
            'transitions' => OnboardingPipeline::TRANSITIONS,
            'auto_timestamp' => OnboardingPipeline::AUTO_TIMESTAMP,
            'properties' => $this->propertyOptions(),
            'team' => $this->teamOptions(),
            'contract_types' => Tenant::CONTRACT_TYPES,
        ];
    }

    private function propertyOptions(): array
    {
        return Property::where('is_active', true)
            ->orderByRaw('code IS NULL, CAST(code AS UNSIGNED)')
            ->get()
            ->map(fn (Property $p) => ['id' => $p->id, 'code' => $p->code, 'address' => $p->address ?: $p->name])
            ->all();
    }

    private function teamOptions(): array
    {
        return User::whereIn('role', ['accommodation', 'admin'])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (User $u) => ['id' => $u->id, 'name' => $u->name])
            ->all();
    }
}
