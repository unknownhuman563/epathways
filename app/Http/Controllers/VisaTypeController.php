<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateVisaTypeRequest;
use App\Models\ActivityLog;
use App\Models\Assessment;
use App\Models\User;
use App\Models\VisaType;
use App\Models\VisaTypePriceHistory;
use App\Notifications\VisaTypePriceChanged;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class VisaTypeController extends Controller
{
    // Laravel 12 ships an empty base controller, so the `$this->authorize()`
    // shortcut used by VisaTypePolicy isn't bundled in. Pull the trait in
    // locally — every other controller in this project guards via
    // middleware instead, so widening the base controller would be churn.
    use AuthorizesRequests;

    /**
     * Portal listing — every Immigration tier + admins can view; only Manager+
     * (per VisaTypePolicy@update) sees the Edit affordance in the UI.
     */
    public function index()
    {
        $this->authorize('viewAny', VisaType::class);

        $user = Auth::user();

        $rows = VisaType::query()
            ->with(['priceHistory.changedBy:id,name'])
            ->orderBy('category')
            ->orderBy('name')
            ->get()
            ->map(fn (VisaType $v) => $this->serialize($v));

        // Route permissions through the policy so the UI affordances and
        // the server-side guards can never drift apart. Anyone who can do
        // X via the policy sees X in the toolbar; anyone who can't, sees a
        // clean rendering with the action hidden.
        return Inertia::render('portal/immigration/VisaTypes', [
            'visaTypes' => $rows,
            'permissions' => [
                'canCreate' => $user?->can('create', VisaType::class) ?? false,
                'canUpdate' => $user?->can('update', VisaType::class) ?? false,
                'canDelete' => $user?->can('delete', VisaType::class) ?? false,
                'canViewHistory' => $user?->can('viewPriceHistory', VisaType::class) ?? false,
            ],
        ]);
    }

    /**
     * Create — inline-validated to keep CreateVisaTypeRequest from doubling
     * UpdateVisaTypeRequest's rules. Code must be unique + uppercase
     * alphanumeric so it stays usable as a system identifier.
     */
    public function store(Request $request)
    {
        $this->authorize('create', VisaType::class);

        $payload = $request->validate([
            // A code must not duplicate another visa's NAME (and vice versa)
            // — leads store their visa as free text, so an ambiguous value
            // can't be resolved to one catalogue row and the applicant's
            // tracker could render the wrong checklist.
            'code' => [
                'required', 'string', 'max:32', 'regex:/^[A-Z0-9_-]+$/', 'unique:visa_types,code',
                function ($attr, $value, $fail) {
                    if ($clash = VisaType::otherNamed($value)) {
                        $fail("This code is already used as the name of the visa \"{$clash->name}\". Codes and names must not overlap.");
                    }
                },
            ],
            'name' => [
                'required', 'string', 'max:100',
                function ($attr, $value, $fail) {
                    if ($clash = VisaType::otherCoded($value)) {
                        $fail("This name is already used as the code of the visa \"{$clash->name}\". Codes and names must not overlap.");
                    }
                },
            ],
            'short_description' => 'nullable|string|max:200',
            'category' => 'nullable|string|max:50',
            'visa_type' => 'nullable|string|max:60',
            'consultation_price_nzd' => 'required|numeric|min:0|max:5000',
            'professional_fees' => 'nullable|numeric|min:0|max:1000000',
            'inz_application_fee' => 'nullable|numeric|min:0|max:1000000',
            'consultation_duration_minutes' => 'required|integer|min:15|max:180',
            'estimated_minutes' => 'required|integer|min:5|max:60',
            'inz_form_refs' => 'nullable|string|max:120',
            'icon' => 'required|string|max:60',
            'active' => 'required|boolean',
            // Per-visa checklist — same shape as the update endpoint so
            // the React form can post identical payloads.
            'checklist_items' => 'nullable|array|max:50',
            'checklist_items.*.key' => 'required|string|max:80|regex:/^[a-z0-9_]+$/',
            'checklist_items.*.label' => 'required|string|max:120',
            // Section/group heading. MUST be validated — anything not listed
            // here is stripped by validate(), which would silently drop the
            // grouping from every item the moment a visa is saved.
            'checklist_items.*.category' => 'nullable|string|max:60',
            'checklist_items.*.hint' => 'nullable|string|max:200',
            'checklist_items.*.required' => 'sometimes|boolean',
            'checklist_items.*.file_code' => 'nullable|string|max:20',
            'checklist_items.*.file_suffix' => 'nullable|string|max:40',
        ], [
            'code.regex' => 'Code must be uppercase letters, numbers, dashes, or underscores only.',
            'code.unique' => 'A visa type with that code already exists.',
            'checklist_items.*.key.regex' => 'Checklist keys must be lowercase letters, numbers, and underscores.',
        ]);

        $visa_type = VisaType::create($payload);

        ActivityLog::record('visa_type.created', [
            'entity_type' => VisaType::class,
            'entity_id' => $visa_type->id,
            'description' => "Created visa type {$visa_type->name}",
        ]);

        return back()->with('success', 'Visa type created');
    }

    /**
     * Update — diff fields, persist, log to audit, dispatch notifications.
     */
    public function update(UpdateVisaTypeRequest $request, VisaType $visa_type)
    {
        $payload = $request->validated();
        $oldPrice = (float) $visa_type->consultation_price_nzd;
        $newPrice = (float) $payload['consultation_price_nzd'];
        $priceChanged = abs($oldPrice - $newPrice) > 0.0001;

        // Optimistic-lock guard — if the row moved since the form was rendered,
        // reject so the user can re-load.
        if ($request->filled('updated_at')) {
            $stamp = Carbon::parse($request->input('updated_at'))->setTimezone('UTC');
            if ($visa_type->updated_at && ! $visa_type->updated_at->equalTo($stamp)) {
                return back()->withErrors([
                    'error' => 'Another user updated this visa type. Please refresh and try again.',
                ]);
            }
        }

        $diff = [];
        foreach ([
            'name', 'code', 'short_description', 'visa_type',
            'consultation_price_nzd', 'professional_fees', 'inz_application_fee',
            'consultation_duration_minutes',
            'estimated_minutes', 'icon', 'inz_form_refs', 'active',
        ] as $field) {
            $old = $visa_type->$field;
            $new = $payload[$field] ?? $old;
            if ((string) $old !== (string) $new) {
                $diff[$field] = ['old' => $old, 'new' => $new];
            }
        }

        // Checklist changes are an array, so compare the JSON-encoded form.
        $oldChecklist = $visa_type->checklist_items ?? [];
        $newChecklist = $payload['checklist_items'] ?? [];
        if (json_encode($oldChecklist) !== json_encode($newChecklist)) {
            $diff['checklist_items'] = [
                'old' => count($oldChecklist).' item(s)',
                'new' => count($newChecklist).' item(s)',
            ];
        }

        if (empty($diff)) {
            return back()->with('success', 'No changes to save.');
        }

        $historyEntry = null;

        // Price changes are still audited, but staff no longer have to type a
        // justification — we record an auto-generated summary instead.
        $autoReason = "Price changed from \${$oldPrice} to \${$newPrice}";

        DB::transaction(function () use ($visa_type, $payload, $priceChanged, $oldPrice, $newPrice, $diff, $autoReason, &$historyEntry) {
            if ($priceChanged) {
                $historyEntry = VisaTypePriceHistory::create([
                    'visa_type_id' => $visa_type->id,
                    'old_price_nzd' => $oldPrice,
                    'new_price_nzd' => $newPrice,
                    'changed_by_user_id' => Auth::id(),
                    'reason' => $autoReason,
                    'changed_at' => Carbon::now(),
                ]);
            }

            $visa_type->update([
                'name' => $payload['name'],
                'code' => $payload['code'],
                'short_description' => $payload['short_description'] ?? null,
                'visa_type' => $payload['visa_type'] ?? null,
                'consultation_price_nzd' => $newPrice,
                'professional_fees' => $payload['professional_fees'] ?? null,
                'inz_application_fee' => $payload['inz_application_fee'] ?? null,
                'consultation_duration_minutes' => $payload['consultation_duration_minutes'],
                'estimated_minutes' => $payload['estimated_minutes'],
                'icon' => $payload['icon'],
                'inz_form_refs' => $payload['inz_form_refs'] ?? null,
                'checklist_items' => $payload['checklist_items'] ?? null,
                'active' => $payload['active'],
            ]);

            ActivityLog::record('visa_type.updated', [
                'entity_type' => VisaType::class,
                'entity_id' => $visa_type->id,
                'changes' => $diff,
                'description' => "Updated visa type {$visa_type->name}",
                'metadata' => $priceChanged ? ['reason' => $autoReason] : null,
            ]);

            if ($priceChanged) {
                ActivityLog::record('visa_type.price_changed', [
                    'entity_type' => VisaType::class,
                    'entity_id' => $visa_type->id,
                    'changes' => ['consultation_price_nzd' => $diff['consultation_price_nzd']],
                    'description' => "Changed {$visa_type->name} price from \${$oldPrice} to \${$newPrice}",
                    'metadata' => [
                        'old_price' => $oldPrice,
                        'new_price' => $newPrice,
                        'reason' => $autoReason,
                    ],
                ]);
            }
        });

        if ($priceChanged && $historyEntry) {
            $recipients = User::query()
                ->whereIn('role', [
                    User::ROLE_SUPER_ADMIN,
                    User::ROLE_ADMIN,
                    User::ROLE_IMMIGRATION_MANAGER,
                    User::ROLE_IMMIGRATION_ADVISER,
                ])
                ->get();
            $actorName = Auth::user()?->name ?? 'System';
            Notification::send($recipients, new VisaTypePriceChanged($visa_type->fresh(), $historyEntry, $actorName));
        }

        return back()->with('success', 'Visa type updated');
    }

    /**
     * Loadable document-checklist templates for the "Load a checklist
     * template" picker in the Visas add/edit modal. Lets staff apply a
     * ready-made checklist (Student, Partnership, AEWV, …) to any visa they
     * created by hand — no seeding or fixed code required.
     */
    public function checklistTemplates()
    {
        $this->authorize('viewAny', VisaType::class);

        $templates = collect((new \Database\Seeders\VisaChecklistSeeder)->templates())
            ->map(fn (array $t, string $key) => [
                'key' => $key,
                'label' => $t['label'],
                'count' => count($t['items']),
                'items' => $t['items'],
            ])
            ->values();

        return response()->json(['templates' => $templates]);
    }

    /**
     * Paginated price history for the visa type — UI hits this when the
     * "Price history" panel inside the edit modal is expanded.
     */
    public function priceHistory(VisaType $visa_type)
    {
        $this->authorize('viewPriceHistory', $visa_type);

        return response()->json([
            'history' => $visa_type->priceHistory()->with('changedBy:id,name')->paginate(20),
        ]);
    }

    /**
     * Soft-delete. Blocks if any active assessment is using this visa type.
     */
    public function destroy(VisaType $visa_type)
    {
        $this->authorize('delete', $visa_type);

        $activeCount = Assessment::query()
            ->where('visa_type_id', $visa_type->id)
            ->whereIn('status', ['submitted', 'paid', 'booked'])
            ->count();
        if ($activeCount > 0) {
            return back()->withErrors([
                'error' => "Cannot delete this visa type because there are {$activeCount} active assessments using it. Mark it as inactive instead, or wait until those assessments complete.",
            ]);
        }

        $visa_type->delete();
        ActivityLog::record('visa_type.deleted', [
            'entity_type' => VisaType::class,
            'entity_id' => $visa_type->id,
            'description' => "Deleted visa type {$visa_type->name}",
        ]);

        return back()->with('success', 'Visa type deleted');
    }

    private function serialize(VisaType $v): array
    {
        return [
            'id' => $v->id,
            'code' => $v->code,
            'name' => $v->name,
            'short_description' => $v->short_description,
            'category' => $v->category,
            'visa_type' => $v->visa_type,
            'consultation_price_nzd' => (float) $v->consultation_price_nzd,
            'professional_fees' => $v->professional_fees === null ? null : (float) $v->professional_fees,
            'inz_application_fee' => $v->inz_application_fee === null ? null : (float) $v->inz_application_fee,
            'consultation_duration_minutes' => (int) $v->consultation_duration_minutes,
            'estimated_minutes' => (int) $v->estimated_minutes,
            'icon' => $v->icon ?? 'Globe',
            'inz_form_refs' => $v->inz_form_refs,
            'checklist_items' => is_array($v->checklist_items) ? $v->checklist_items : [],
            'active' => (bool) $v->active,
            'updated_at' => $v->updated_at?->toIso8601String(),
            'price_history' => $v->priceHistory->take(10)->map(fn (VisaTypePriceHistory $h) => [
                'id' => $h->id,
                'old_price_nzd' => $h->old_price_nzd === null ? null : (float) $h->old_price_nzd,
                'new_price_nzd' => (float) $h->new_price_nzd,
                'changed_by' => $h->changedBy?->name,
                'reason' => $h->reason,
                'changed_at' => $h->changed_at?->toIso8601String(),
            ])->values(),
        ];
    }
}
