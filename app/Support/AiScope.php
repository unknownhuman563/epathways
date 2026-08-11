<?php

namespace App\Support;

use App\Models\Lead;
use App\Models\User;

/**
 * Record-level access for the AI assistant — a staffer may only ask about
 * records their department owns; admins see all. Shared by the chat endpoint
 * and the assistant page so the two can never diverge.
 *
 * This is the beachhead scope check; the fuller scope broker in
 * docs/ai-agent/ generalises it to every entity.
 */
class AiScope
{
    public static function canAccessLead(User $user, Lead $lead): bool
    {
        if ($user->isAdmin()) {
            return true; // admin + super_admin see every department
        }

        return match ($user->role) {
            'immigration',
            User::ROLE_IMMIGRATION_MANAGER,
            User::ROLE_IMMIGRATION_ADVISER => (bool) $lead->is_immigration_case,
            'education' => (bool) $lead->is_student,
            'english' => (bool) ($lead->is_english_student ?? $lead->is_student),
            'sales' => ! $lead->is_immigration_case, // sales works the pipeline, not immigration cases
            default => false,
        };
    }
}
