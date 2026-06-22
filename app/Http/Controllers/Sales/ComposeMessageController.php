<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use App\Support\LeadAccess;
use Illuminate\Http\Request;

/**
 * One-off message to a single lead from the lead detail page. Email / SMS /
 * both, template-or-custom, personalised and logged via CommunicationService.
 * Access-gated per lead so a staffer can only message a lead in their
 * department (admins anyone).
 */
class ComposeMessageController extends Controller
{
    public function __construct(protected CommunicationService $comms) {}

    /** POST /admin/leads/{lead}/compose */
    public function send(Request $request, Lead $lead)
    {
        abort_unless(LeadAccess::canView($request->user(), $lead), 403, 'You do not have access to this lead.');

        $data = $request->validate([
            'channel'     => 'required|in:email,sms,both',
            'template_id' => 'nullable|integer|exists:message_templates,id',
            'subject'     => 'nullable|required_if:channel,email|required_if:channel,both|string|max:255',
            'body'        => 'required|string|max:50000',
        ]);

        $logs = [];

        if (! empty($data['template_id'])) {
            $template = MessageTemplate::findOrFail($data['template_id']);
            $sent = $this->comms->sendTemplated($template->key, $lead);
            $logs = array_values(array_filter([$sent['email'] ?? null, $sent['sms'] ?? null]));
        } else {
            $subject = $this->comms->render($lead, (string) ($data['subject'] ?? ''));
            $body    = $this->comms->render($lead, $data['body']);

            if (in_array($data['channel'], ['email', 'both'], true)) {
                $logs[] = $this->comms->sendRaw(MessageLog::CHANNEL_EMAIL, $lead, $subject, $body);
            }
            if (in_array($data['channel'], ['sms', 'both'], true)) {
                $logs[] = $this->comms->sendRaw(MessageLog::CHANNEL_SMS, $lead, null, $body);
            }
        }

        return response()->json(['logs' => $logs, 'count' => count($logs)]);
    }
}
