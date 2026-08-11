<?php

namespace App\Services\Immigration;

/**
 * The document checklist a dependant must satisfy, by relationship. A dependant
 * child included in a principal's application has a defined set of required
 * documents (dependent child visa); a partner has a different set. Uploads map
 * to a checklist_key so we can show per-item status + overall progress.
 *
 * Keys are stable — they're stored on lead_documents.checklist_key.
 */
class DependentChecklist
{
    /** Dependent child visa. */
    public const CHILD = [
        ['key' => 'child.passport', 'label' => "Child's passport (bio page)", 'required' => true],
        ['key' => 'child.birth_certificate', 'label' => 'Full birth certificate (showing both parents)', 'required' => true],
        ['key' => 'child.photo', 'label' => 'Passport-style photo', 'required' => true],
        ['key' => 'child.relationship_evidence', 'label' => 'Evidence of relationship to the principal applicant', 'required' => true],
        ['key' => 'child.custody_consent', 'label' => 'Custody / consent from any non-accompanying parent', 'required' => true],
        ['key' => 'child.medical', 'label' => 'Medical / chest x-ray certificate (if required)', 'required' => false],
        ['key' => 'child.school_enrolment', 'label' => 'School enrolment / offer (if school age)', 'required' => false],
    ];

    /** Partner included in a temporary-entry application. */
    public const PARTNER = [
        ['key' => 'partner.passport', 'label' => "Partner's passport (bio page)", 'required' => true],
        ['key' => 'partner.relationship_evidence', 'label' => 'Evidence of genuine and stable relationship', 'required' => true],
        ['key' => 'partner.photo', 'label' => 'Passport-style photo', 'required' => true],
        ['key' => 'partner.medical', 'label' => 'Medical / chest x-ray certificate (if required)', 'required' => false],
    ];

    /** Parent / sibling / other dependant. */
    public const DEFAULT = [
        ['key' => 'dependant.passport', 'label' => 'Passport (bio page)', 'required' => true],
        ['key' => 'dependant.relationship_evidence', 'label' => 'Evidence of relationship to the principal applicant', 'required' => true],
        ['key' => 'dependant.photo', 'label' => 'Passport-style photo', 'required' => true],
        ['key' => 'dependant.medical', 'label' => 'Medical / chest x-ray certificate (if required)', 'required' => false],
    ];

    /** @return array<int, array{key:string,label:string,required:bool}> */
    public static function for(string $relationship): array
    {
        return match ($relationship) {
            'child' => self::CHILD,
            'partner' => self::PARTNER,
            default => self::DEFAULT,
        };
    }

    /** @return array<int, string> valid checklist keys for a relationship */
    public static function keys(string $relationship): array
    {
        return array_column(self::for($relationship), 'key');
    }
}
