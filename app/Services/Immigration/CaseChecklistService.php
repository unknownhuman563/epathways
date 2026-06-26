<?php

namespace App\Services\Immigration;

use App\Models\Lead;
use App\Models\LeadDocument;
use App\Models\VisaType;
use Illuminate\Support\Collection;

/**
 * Build 11.D Phase 4 — Visa-type checklist resolver.
 *
 * Reads from the existing checklist mechanism (no migration, no new
 * tables) — documented in Phase 1's audit:
 *
 *   VisaType.checklist_items is JSON shaped [{key, label, hint, required, category?}].
 *   LeadDocument.checklist_key matches VisaType.checklist_items[].key for the join.
 *   Documents have a `note` column (NOT reviewer_notes — the Phase 4 spec used
 *   the wrong name; the actual schema is `note` per LeadDocument.php:24 and
 *   the create-table migration).
 *
 * Three resolution levels for forCase():
 *   1. per-lead override (Lead.document_checklist JSON, when populated)
 *   2. visa-type catalog (VisaType.checklist_items by inz_visa_type string match)
 *   3. empty fallback
 *
 * Unknown / unmatched visa types degrade gracefully — return [] so the
 * UI falls back to its "no checklist, show uploaded files" mode without
 * crashing.
 */
class CaseChecklistService
{
    /**
     * Raw checklist items for the case. Resolution order above. Items are
     * normalised so the consumer can rely on `key` + `label` being present.
     *
     * @return array<int, array<string, mixed>>
     */
    public function forCase(Lead $lead): array
    {
        // 1. Per-lead override. The Lead model has `document_checklist`
        //    (JSON cast) for cases where the standard visa-type list
        //    has been customised for this applicant.
        if (! empty($lead->document_checklist) && is_array($lead->document_checklist)) {
            return $this->normaliseItems($lead->document_checklist);
        }

        // 2. Visa-type catalog. inz_visa_type is a free-form string column
        //    (no FK), so an unknown value just resolves to null and we
        //    fall through to the empty fallback.
        if (! empty($lead->inz_visa_type)) {
            $visaType = VisaType::query()->where('name', $lead->inz_visa_type)->first();
            if ($visaType && ! empty($visaType->checklist_items) && is_array($visaType->checklist_items)) {
                return $this->normaliseItems($visaType->checklist_items);
            }
        }

        // 3. Empty fallback — UI shows the "no structured checklist" panel.
        return [];
    }

    /**
     * Resolution source descriptor — lets the UI display "Source: visa_type · Student Visa".
     *
     * @return array{source: string, visa: ?string}
     */
    public function sourceFor(Lead $lead): array
    {
        if (! empty($lead->document_checklist) && is_array($lead->document_checklist)) {
            return ['source' => 'lead_override', 'visa' => $lead->inz_visa_type];
        }
        if (! empty($lead->inz_visa_type)) {
            $hit = VisaType::query()->where('name', $lead->inz_visa_type)->first();
            if ($hit && ! empty($hit->checklist_items)) {
                return ['source' => 'visa_type', 'visa' => $hit->name];
            }
        }
        return ['source' => 'none', 'visa' => $lead->inz_visa_type];
    }

    /**
     * Checklist items with status from the case's LeadDocuments attached.
     * Most-recent doc wins per checklist_key. Items without an upload get
     * `status = 'not_submitted'` and a null document_id.
     *
     * @return array<int, array<string, mixed>>
     */
    public function withStatuses(Lead $lead): array
    {
        $items = $this->forCase($lead);
        if (empty($items)) {
            return [];
        }

        $docsByKey = $this->latestDocumentsByKey($lead);

        return collect($items)->map(function (array $item) use ($docsByKey) {
            $doc = $docsByKey->get($item['key']) ?? null;
            return [
                'key'         => $item['key'],
                'label'       => $item['label'],
                'hint'        => $item['hint'] ?? null,
                'required'    => (bool) ($item['required'] ?? false),
                // Default category — Phase 1's documented JSON shape doesn't
                // include `category`. Seed labels embed it as "Category · Name"
                // so the frontend can parse it for grouping; backend just
                // surfaces whatever the JSON says.
                'category'    => $item['category'] ?? null,
                'status'      => $doc?->status ?? 'not_submitted',
                'uploaded_at' => $doc?->created_at?->toIso8601String(),
                'note'        => $doc?->note,
                'document_id' => $doc?->id,
            ];
        })->toArray();
    }

    /**
     * withStatuses() result grouped by category. When no `category` field is
     * present on items, everything lands under "Required Documents" (single
     * group) per the Phase 4 spec — we don't invent categories from key
     * prefixes because it's brittle.
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    public function groupedByCategory(Lead $lead): array
    {
        $items = $this->withStatuses($lead);
        if (empty($items)) {
            return [];
        }

        return collect($items)
            ->groupBy(fn (array $item) => $item['category'] ?: 'Required Documents')
            ->map(fn (Collection $group) => $group->values()->toArray())
            ->toArray();
    }

    /**
     * Documents that don't tie back to any checklist item — either
     * uploaded with a null checklist_key, or uploaded against a key that
     * the current visa-type checklist no longer recognises (e.g. visa
     * type changed mid-case). The UI surfaces these under an "Other"
     * group so nothing is hidden from staff.
     *
     * @return array<int, array<string, mixed>>
     */
    public function unstructuredDocuments(Lead $lead): array
    {
        $knownKeys = collect($this->forCase($lead))->pluck('key')->filter()->all();
        $known = array_flip($knownKeys);

        return $lead->documents()
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn (LeadDocument $d) => empty($d->checklist_key) || ! isset($known[$d->checklist_key]))
            ->map(fn (LeadDocument $d) => [
                'document_id'   => $d->id,
                'original_name' => $d->original_name,
                'status'        => $d->status,
                'uploaded_at'   => $d->created_at?->toIso8601String(),
                'checklist_key' => $d->checklist_key, // null = truly unstructured
                'note'          => $d->note,
            ])
            ->values()
            ->toArray();
    }

    /**
     * Compact progress summary for the tab header. Only REQUIRED items
     * count toward the denominator — optional items don't move the needle
     * on "case ready for submission".
     *
     * @return array{required_total: int, required_approved: int, total: int, approved: int}
     */
    public function progress(Lead $lead): array
    {
        $items = $this->withStatuses($lead);
        $required = array_values(array_filter($items, fn ($i) => ! empty($i['required'])));

        return [
            'required_total'    => count($required),
            'required_approved' => count(array_filter($required, fn ($i) => $i['status'] === LeadDocument::STATUS_APPROVED)),
            'total'             => count($items),
            'approved'          => count(array_filter($items, fn ($i) => $i['status'] === LeadDocument::STATUS_APPROVED)),
        ];
    }

    /**
     * Newest LeadDocument per checklist_key — used by withStatuses() to
     * decorate each row. Documents with no checklist_key are excluded
     * (they show up in unstructuredDocuments() instead).
     */
    private function latestDocumentsByKey(Lead $lead): Collection
    {
        return $lead->documents()
            ->whereNotNull('checklist_key')
            ->orderByDesc('created_at')
            ->get()
            ->groupBy('checklist_key')
            ->map(fn (Collection $docs) => $docs->first());
    }

    /**
     * Defensive: drop malformed checklist items missing `key` or `label`
     * so a typo in the JSON doesn't crash the controller. Re-indexes.
     */
    private function normaliseItems(array $items): array
    {
        return collect($items)
            ->filter(fn ($item) => is_array($item) && ! empty($item['key']) && isset($item['label']))
            ->values()
            ->toArray();
    }
}
