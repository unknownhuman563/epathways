<?php

namespace App\Notifications;

use App\Models\Lead;
use App\Models\LeadDocument;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

/**
 * Sent to a lead's assigned staff member when the lead uploads a
 * document via the public /track/{code} flow. Database channel only.
 */
class DocumentSubmittedForReview extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Lead $lead,
        public readonly LeadDocument $document,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $name = trim("{$this->lead->first_name} {$this->lead->last_name}") ?: 'a lead';
        $docName = $this->document->original_name ?: 'a document';

        return [
            'title'         => 'Document submitted for review',
            'body'          => "{$name} uploaded \"{$docName}\".",
            'lead_id'       => $this->lead->id,
            'lead_name'     => $name,
            'document_id'   => $this->document->id,
            'document_name' => $docName,
            'document_type' => $this->document->checklist_key,
            'link'          => "/admin/leads/{$this->lead->id}",
        ];
    }
}
