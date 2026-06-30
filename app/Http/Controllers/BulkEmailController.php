<?php

namespace App\Http\Controllers;

use App\Jobs\SendCampaign;
use App\Models\EmailCampaign;
use App\Models\Lead;
use App\Models\MessageTemplate;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Bulk-email campaigns for the sales portal (admins reach it by browsing the
 * portal). Compose from a department/shared template, pick recipients from the
 * leads list, send now or schedule. History + per-recipient status come from
 * message_logs keyed by campaign_id. Scoped to the acting department.
 */
class BulkEmailController extends Controller
{
    public function index(Request $request)
    {
        $department = $this->department($request);

        return inertia('portal/sales/BulkEmail', [
            'portal' => 'sales',
            'templates' => $this->availableTemplates($department),
            'recipients' => $this->recipientPool(),
            'campaigns' => EmailCampaign::forDepartmentList($department)
                ->with('creator:id,name')
                ->latest()->get()->map(fn (EmailCampaign $c) => $this->campaignRow($c)),
        ]);
    }

    public function store(Request $request)
    {
        $department = $this->department($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'template_id' => ['required', 'integer', 'exists:message_templates,id'],
            'recipient_lead_ids' => ['required', 'array', 'min:1'],
            'recipient_lead_ids.*' => ['integer'],
            'action' => ['required', Rule::in(['send_now', 'schedule'])],
            'scheduled_at' => ['nullable', 'required_if:action,schedule', 'date', 'after:now'],
        ]);

        $template = MessageTemplate::findOrFail($data['template_id']);
        $this->authorizeTemplate($department, $template);
        if (! $template->is_active || ! $template->hasChannel('email')) {
            return back()->with('error', 'Pick an active email template.');
        }

        // Keep only real, emailable recipients (snapshot for history fidelity).
        $recipientIds = Lead::whereIn('id', $data['recipient_lead_ids'])
            ->whereNotNull('email')->where('email', '!=', '')
            ->pluck('id')->all();

        if (empty($recipientIds)) {
            return back()->with('error', 'None of the selected leads have an email address.');
        }

        $scheduling = $data['action'] === 'schedule';

        $campaign = EmailCampaign::create([
            'name' => $data['name'],
            'department' => $department ?? '',
            'created_by' => $request->user()->id,
            'template_id' => $template->id,
            'subject' => (string) $template->email_subject,
            'body' => (string) $template->email_body,
            'status' => $scheduling ? EmailCampaign::STATUS_SCHEDULED : EmailCampaign::STATUS_SENDING,
            'scheduled_at' => $scheduling ? $data['scheduled_at'] : null,
            'total_recipients' => count($recipientIds),
            'recipient_lead_ids' => $recipientIds,
        ]);

        if (! $scheduling) {
            SendCampaign::dispatch($campaign->id);

            return redirect()->to($this->base($request))
                ->with('success', "Campaign '{$campaign->name}' is sending to ".count($recipientIds).' recipients.');
        }

        return redirect()->to($this->base($request))
            ->with('success', "Campaign '{$campaign->name}' scheduled for ".$campaign->scheduled_at->format('M j, Y g:i A').'.');
    }

    public function show(Request $request, $id)
    {
        $department = $this->department($request);
        $campaign = EmailCampaign::with('creator:id,name')->findOrFail($id);
        $this->authorizeCampaign($department, $campaign);

        return inertia('portal/sales/CampaignDetail', [
            'portal' => 'sales',
            'campaign' => array_merge($this->campaignRow($campaign), [
                'subject' => $campaign->subject,
                'body' => $campaign->body,
            ]),
            'recipients' => $campaign->logs()->with('lead:id,first_name,last_name,email')
                ->latest()->get()->map(fn ($log) => [
                    'id' => $log->id,
                    'name' => trim(($log->lead->first_name ?? '').' '.($log->lead->last_name ?? '')) ?: '—',
                    'email' => $log->recipient_address,
                    'status' => $log->status,
                    'error' => $log->error_message,
                ]),
        ]);
    }

    public function cancel(Request $request, $id)
    {
        $department = $this->department($request);
        $campaign = EmailCampaign::findOrFail($id);
        $this->authorizeCampaign($department, $campaign);

        if (! $campaign->isCancelable()) {
            return back()->with('error', 'Only scheduled campaigns can be canceled.');
        }

        $campaign->update(['status' => EmailCampaign::STATUS_CANCELED]);

        return back()->with('success', 'Campaign canceled.');
    }

    // ─── Helpers ──────────────────────────────────────────────────────────

    /** Acting department from the portal route (e.g. 'sales'); null = admin scope. */
    private function department(Request $request): ?string
    {
        $name = (string) $request->route()?->getName();
        if (str_starts_with($name, 'portal.')) {
            $candidate = explode('.', $name)[1] ?? null;
            if (in_array($candidate, MessageTemplate::DEPARTMENTS, true)) {
                return $candidate;
            }
        }

        return null;
    }

    private function base(Request $request): string
    {
        $dept = $this->department($request) ?? 'sales';

        return "/portal/{$dept}/bulk-email";
    }

    /** Active, email-capable templates this department may use (own + shared). */
    private function availableTemplates(?string $department): \Illuminate\Support\Collection
    {
        return MessageTemplate::active()
            ->when($department !== null, fn ($q) => $q->whereIn('department', [$department, '']))
            ->orderBy('name')->get()
            ->filter(fn (MessageTemplate $t) => $t->hasChannel('email'))
            ->map(fn (MessageTemplate $t) => [
                'id' => $t->id, 'name' => $t->name,
                'subject' => $t->email_subject, 'body' => $t->email_body,
            ])->values();
    }

    /** Selectable recipients: every lead with an email, for client-side filtering. */
    private function recipientPool(): \Illuminate\Support\Collection
    {
        return Lead::whereNotNull('email')->where('email', '!=', '')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'stage', 'status'])
            ->map(fn (Lead $l) => [
                'id' => $l->id,
                'name' => trim("{$l->first_name} {$l->last_name}") ?: '—',
                'email' => $l->email,
                'stage' => $l->stage,
                'status' => $l->status,
            ]);
    }

    private function campaignRow(EmailCampaign $c): array
    {
        return [
            'id' => $c->id,
            'name' => $c->name,
            'status' => $c->status,
            'total' => $c->total_recipients,
            'sent' => $c->sent_count,
            'failed' => $c->failed_count,
            'scheduled_at' => optional($c->scheduled_at)?->toIso8601String(),
            'completed_at' => optional($c->completed_at)?->toIso8601String(),
            'created_at' => optional($c->created_at)?->toIso8601String(),
            'created_by' => $c->creator?->name,
            'cancelable' => $c->isCancelable(),
        ];
    }

    private function authorizeTemplate(?string $department, MessageTemplate $template): void
    {
        if ($department !== null && ! in_array($template->department, [$department, ''], true)) {
            abort(403, 'This template belongs to another department.');
        }
    }

    private function authorizeCampaign(?string $department, EmailCampaign $campaign): void
    {
        if ($department !== null && $campaign->department !== $department) {
            abort(403, 'This campaign belongs to another department.');
        }
    }
}
