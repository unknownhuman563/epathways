<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\MessageLog;
use App\Support\LeadAccess;
use Illuminate\Http\Request;

/**
 * Staff-side communications history for one lead — every email/SMS sent TO
 * them, newest first. Access-gated per lead. (sent_at is null while a message
 * is queued, so we order by created_at, not sent_at.)
 */
class LeadCommunicationsController extends Controller
{
    /** GET /admin/leads/{lead}/communications */
    public function index(Request $request, Lead $lead)
    {
        abort_unless(LeadAccess::canView($request->user(), $lead), 403, 'You do not have access to this lead.');

        $logs = MessageLog::query()
            ->where('recipient_type', 'lead')
            ->where('recipient_id', $lead->id)
            ->with('triggeredBy:id,name')
            ->latest()
            ->paginate(50)
            ->through(fn (MessageLog $log) => [
                'id'           => $log->id,
                'channel'      => $log->channel,
                'subject'      => $log->subject,
                'body'         => $log->body,
                'status'       => $log->status,
                'error'        => $log->error_message,
                'sender'       => $log->triggeredBy?->name,
                'template_key' => $log->template_key,
                'created_at'   => $log->created_at?->toIso8601String(),
                'sent_at'      => $log->sent_at?->toIso8601String(),
            ]);

        return response()->json($logs);
    }
}
