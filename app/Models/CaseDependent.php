<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * A dependant included in a principal applicant's immigration case (child /
 * partner / etc.). No login — managed by the principal in the lead portal and
 * by staff in the case profile. Documents attach via lead_documents.dependent_id.
 */
class CaseDependent extends Model
{
    public const RELATIONSHIPS = ['child', 'partner', 'parent', 'sibling', 'other'];

    protected $fillable = [
        'lead_id', 'relationship', 'family_name', 'first_name', 'middle_name',
        'dob', 'gender', 'nationality', 'passport_number', 'passport_expiry',
        'source', 'notes', 'added_by',
    ];

    protected $casts = [
        'dob' => 'date',
        'passport_expiry' => 'date',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(LeadDocument::class, 'dependent_id');
    }

    /** "First Last" (or a placeholder) — never a guessed value. */
    public function fullName(): string
    {
        return trim("{$this->first_name} {$this->family_name}") ?: 'Unnamed dependant';
    }

    /**
     * Resolve this dependant's document checklist (by relationship) against
     * their uploaded documents: per-item status, any extras, and progress.
     * Shared by the case profile (staff) and the lead portal (principal).
     *
     * @return array{checklist: array<int, mixed>, other_documents: array<int, mixed>, progress: array<string, int>}
     */
    public function checklistData(): array
    {
        $items = \App\Services\Immigration\DependentChecklist::for($this->relationship);
        $byKey = $this->documents->whereNotNull('checklist_key')->groupBy('checklist_key');

        $serialize = fn (LeadDocument $doc) => [
            'id' => $doc->id,
            'original_name' => $doc->original_name,
            'mime' => $doc->mime,
            'size' => $doc->size,
            'status' => $doc->status,
            'created_at' => optional($doc->created_at)->toIso8601String(),
        ];

        $requiredTotal = 0;
        $requiredDone = 0;
        $checklist = [];
        foreach ($items as $item) {
            $doc = ($byKey[$item['key']] ?? collect())->first(); // newest first
            $satisfied = $doc && $doc->status !== 'Rejected';
            if ($item['required']) {
                $requiredTotal++;
                $requiredDone += $satisfied ? 1 : 0;
            }
            $checklist[] = [
                'key' => $item['key'],
                'label' => $item['label'],
                'required' => $item['required'],
                'status' => $doc?->status ?? 'Missing',
                'document' => $doc ? $serialize($doc) : null,
            ];
        }

        $keys = array_column($items, 'key');
        $other = $this->documents
            ->filter(fn ($doc) => $doc->checklist_key === null || ! in_array($doc->checklist_key, $keys, true))
            ->map($serialize)->values();

        return [
            'checklist' => $checklist,
            'other_documents' => $other,
            'progress' => ['required_total' => $requiredTotal, 'required_done' => $requiredDone],
        ];
    }
}
