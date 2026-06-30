<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\CommunicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Staff-initiated, manual updates sent to a lead from the lead detail screen.
 * Templates are scoped to the acting staff member's department (plus the
 * shared/global set); admins may use any. The send fills {{status}} and
 * {{status_detail}} from the form and logs a MessageLog like every other send.
 */
class LeadMessageController extends Controller
{
    /** Email-capable templates the current user may send (department + shared). */
    public function templates(Request $request): JsonResponse
    {
        $department = $request->user()->templateDepartment();

        $templates = MessageTemplate::active()
            ->when($department !== null, fn ($q) => $q->whereIn('department', [$department, '']))
            ->orderBy('name')
            ->get()
            ->filter(fn (MessageTemplate $t) => $t->hasChannel('email'))
            ->map(fn (MessageTemplate $t) => [
                'id' => $t->id,
                'name' => $t->name,
                'key' => $t->key,
                'department' => $t->department,
                'channels' => $t->channels ?? [],
            ])
            ->values();

        return response()->json($templates);
    }

    /** Send a chosen template to the lead, filling the status context. */
    public function send(Request $request, $leadId, CommunicationService $comms)
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            'template_id' => ['required', 'integer', 'exists:message_templates,id'],
            'status' => ['nullable', 'string', 'max:120'],
            'status_detail' => ['nullable', 'string', 'max:2000'],
            'attachments' => ['nullable', 'array', 'max:5'],
            'attachments.*' => ['file', 'mimes:pdf,doc,docx,xls,xlsx,csv,jpg,jpeg,png,gif,webp', 'max:10240'],
        ]);

        $template = MessageTemplate::findOrFail($data['template_id']);
        $this->authorizeTemplate($request->user(), $template);

        if (! $template->is_active) {
            return back()->with('error', 'That template is inactive.');
        }
        if (empty($lead->email)) {
            return back()->with('error', 'This lead has no email address on file.');
        }

        // Persist uploads to the private 'local' disk so their paths survive
        // the queued send, then hand the mailable [path, original name] pairs.
        $attachments = [];
        foreach ($request->file('attachments', []) as $file) {
            $attachments[] = [
                'path' => $file->store("email-attachments/{$lead->id}", 'local'),
                'name' => $file->getClientOriginalName(),
            ];
        }

        $comms->sendTemplate($template, $lead, [
            'status' => $data['status'] ?? '',
            'status_detail' => $data['status_detail'] ?? '',
        ], $attachments);

        $count = count($attachments);
        $suffix = $count ? " with {$count} attachment".($count === 1 ? '' : 's') : '';

        return back()->with('success', 'Update sent to '.$lead->email.$suffix.'.');
    }

    /** Staff may only send their own department's or shared templates; admins, any. */
    private function authorizeTemplate(User $user, MessageTemplate $template): void
    {
        $department = $user->templateDepartment();
        if ($department !== null && ! in_array($template->department, [$department, ''], true)) {
            abort(403, 'This template belongs to another department.');
        }
    }
}
