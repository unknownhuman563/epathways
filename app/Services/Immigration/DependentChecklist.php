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
    /** Dependent child — mirrors the applicant document checklist. */
    public const CHILD = [
        ['key' => 'child.cv', 'label' => 'Curriculum Vitae', 'required' => true, 'hint' => 'Current CV summarising education and work history.'],
        ['key' => 'child.passport', 'label' => 'Passport (PDF format)', 'required' => true, 'hint' => 'Clear colour scan of the current, valid passport in PDF format.'],
        ['key' => 'child.face_image', 'label' => 'Face image', 'required' => true, 'hint' => 'Recent passport-style photo — plain background, full face.'],
        ['key' => 'child.birth_certificate', 'label' => 'Birth Certificate', 'required' => true, 'hint' => 'Full birth certificate.'],
        ['key' => 'child.marriage_certificate', 'label' => 'Marriage Certificate', 'required' => false, 'hint' => 'Official marriage certificate, if married. If applicable.'],
        ['key' => 'child.graduate_certificate', 'label' => 'Graduate Certificate', 'required' => true, 'hint' => 'Completed qualification certificate (diploma / degree).'],
        ['key' => 'child.transcript', 'label' => 'Transcript of Record', 'required' => true, 'hint' => 'Official academic transcript from the previous school.'],
        ['key' => 'child.english_test', 'label' => 'PTE / IELTS Result', 'required' => true, 'hint' => 'English test result (PTE Academic, IELTS, or accepted equivalent).'],
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
