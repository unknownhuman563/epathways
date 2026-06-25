<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use App\Support\LeadAccess;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Bulk email from the leads list. Staff tick leads → pick a template or type
 * a custom message → preview → send. Every selected lead is access-checked
 * (403 if any falls outside the user's department) and personalised before
 * sending through the existing CommunicationService.
 */
class BulkEmailController extends Controller
{
    public function __construct(protected CommunicationService $comms) {}

    /** POST /portal/sales/leads/bulk-email/preview — first 3 personalised previews. */
    public function preview(Request $request)
    {
        $data  = $this->validatePayload($request);
        $leads = $this->scopedLeads($request);
        $template = ! empty($data['template_id']) ? MessageTemplate::find($data['template_id']) : null;

        $previews = $leads->take(3)->map(function (Lead $lead) use ($template, $data) {
            [$subject, $body] = $this->renderFor($lead, $template, $data);

            return [
                'lead_id'          => $lead->id,
                'lead_name'        => trim(($lead->first_name ?? '') . ' ' . ($lead->last_name ?? '')),
                'email'            => $lead->email,
                'rendered_subject' => $subject,
                'rendered_body'    => $body,
            ];
        })->values();

        return response()->json([
            'preview_count' => $previews->count(),
            'total_count'   => $leads->count(),
            'previews'      => $previews,
        ]);
    }

    /** POST /portal/sales/leads/bulk-email/send — send to every selected lead. */
    public function send(Request $request)
    {
        $data  = $this->validatePayload($request);
        $leads = $this->scopedLeads($request);

        if (! empty($data['template_id'])) {
            $template = MessageTemplate::findOrFail($data['template_id']);
            $results = $this->comms->bulkSendTemplated($leads, $template);
        } else {
            $results = $this->sendCustom($leads, $data);
        }

        return response()->json([
            'sent'    => collect($results)->where('status', 'sent')->count(),
            'failed'  => collect($results)->where('status', 'failed')->count(),
            'results' => $results,
        ]);
    }

    /** Loop custom (template-free) email, personalised per lead. */
    private function sendCustom(Collection $leads, array $data): array
    {
        $results = [];

        foreach ($leads as $lead) {
            try {
                $subject = $this->comms->render($lead, (string) ($data['subject'] ?? ''));
                $body    = $this->comms->render($lead, (string) $data['body']);
                $log     = $this->comms->sendRaw(MessageLog::CHANNEL_EMAIL, $lead, $subject, $body);

                $results[] = [
                    'lead_id' => $lead->id,
                    'status'  => $log->status === MessageLog::STATUS_FAILED ? 'failed' : 'sent',
                    'log_id'  => $log->id,
                    'error'   => $log->error_message,
                ];
            } catch (\Throwable $e) {
                $results[] = ['lead_id' => $lead->id, 'status' => 'failed', 'log_id' => null, 'error' => $e->getMessage()];
            }
        }

        return $results;
    }

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'lead_ids'    => 'required|array|min:1|max:200',
            'lead_ids.*'  => 'integer|exists:leads,id',
            'template_id' => 'nullable|integer|exists:message_templates,id',
            'subject'     => 'required_without:template_id|string|max:255',
            'body'        => 'required_without:template_id|string|max:50000',
        ]);
    }

    /**
     * Resolve the selected leads, aborting 403 if ANY is outside the user's
     * department — no silent partial sends across a security boundary.
     */
    private function scopedLeads(Request $request): Collection
    {
        $user  = $request->user();
        $leads = Lead::whereIn('id', $request->input('lead_ids', []))->get();

        foreach ($leads as $lead) {
            abort_unless(LeadAccess::canView($user, $lead), 403, 'One or more selected leads are outside your access.');
        }

        return $leads;
    }

    private function renderFor(Lead $lead, ?MessageTemplate $template, array $data): array
    {
        if ($template) {
            return [
                $this->comms->render($lead, (string) $template->email_subject),
                $this->comms->render($lead, (string) $template->email_body),
            ];
        }

        return [
            $this->comms->render($lead, (string) ($data['subject'] ?? '')),
            $this->comms->render($lead, (string) ($data['body'] ?? '')),
        ];
    }
}
