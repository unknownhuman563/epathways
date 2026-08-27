<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailAutomationMessage;
use App\Models\MessageTemplate;
use App\Services\EmailEventRegistry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Email Automation settings (admin + super-admin only). Admins choose which
 * events send a message, to whom, and with which template. The event catalogue
 * lives in EmailEventRegistry; these rows are the editable "who gets what".
 */
class EmailAutomationController extends Controller
{
    public function index(EmailEventRegistry $registry)
    {
        $messages = EmailAutomationMessage::orderBy('sort_order')->get()
            ->groupBy('event_key')
            ->map(fn ($rows) => $rows->map(fn (EmailAutomationMessage $m) => [
                'recipient'     => $m->recipient,
                'template_key'  => $m->template_key,
                'channel'       => $m->channel,
                'delay_minutes' => $m->delay_minutes,
                'enabled'       => $m->enabled,
            ])->values());

        // Distinct active template keys for the pickers.
        $templates = MessageTemplate::active()
            ->whereNotNull('key')->where('key', '!=', '')
            ->orderBy('key')->pluck('key')->unique()->values();

        return Inertia::render('admin/EmailAutomation', [
            'catalogue'       => $registry->catalogue(),
            'departments'     => EmailEventRegistry::DEPARTMENTS,
            'recipients'      => EmailEventRegistry::RECIPIENTS,
            'recipientLabels' => EmailEventRegistry::RECIPIENT_LABELS,
            'templates'       => $templates,
            'messages'        => $messages,
        ]);
    }

    /**
     * Replace the whole automation configuration with the posted set. The page
     * sends every message it knows about, so a full replace keeps the table in
     * exact sync with what the admin sees.
     */
    public function save(Request $request)
    {
        $data = $request->validate([
            'messages'                  => 'present|array',
            'messages.*.event_key'      => 'required|string|max:120',
            'messages.*.recipient'      => 'required|string|max:30',
            'messages.*.template_key'   => 'nullable|string|max:120',
            'messages.*.channel'        => 'nullable|string|in:email,sms,both',
            'messages.*.delay_minutes'  => 'nullable|integer|min:0|max:10080',
            'messages.*.enabled'        => 'nullable|boolean',
        ]);

        DB::transaction(function () use ($data) {
            EmailAutomationMessage::query()->delete();
            $sort = 0;
            foreach ($data['messages'] as $m) {
                EmailAutomationMessage::create([
                    'event_key'     => $m['event_key'],
                    'recipient'     => $m['recipient'],
                    'template_key'  => $m['template_key'] ?? null,
                    'channel'       => $m['channel'] ?? 'email',
                    'delay_minutes' => $m['delay_minutes'] ?? 0,
                    'enabled'       => (bool) ($m['enabled'] ?? false),
                    'sort_order'    => $sort++,
                ]);
            }
        });

        return back()->with('success', 'Email automation saved.');
    }

    /**
     * Send a test of one template to the signed-in admin, so they can check the
     * wording and confirm delivery before switching an automation on.
     */
    public function test(Request $request)
    {
        $data = $request->validate([
            'template_key' => 'required|string|max:120',
        ]);

        $me = $request->user();
        if (empty($me?->email)) {
            return back()->withErrors(['error' => 'Your account has no email address to send the test to.']);
        }

        $template = MessageTemplate::active()->where('key', $data['template_key'])
            ->orderByRaw("CASE WHEN department = '' OR department IS NULL THEN 1 ELSE 0 END")
            ->first();
        if (! $template) {
            return back()->withErrors(['error' => "No active template named “{$data['template_key']}”."]);
        }

        try {
            $subject = '[TEST] '.($template->email_subject ?: $template->key);
            $body = (string) ($template->email_body ?: '(This template has no email body yet.)');

            // sendNow (not send/queue): TemplatedMessage is ShouldQueue, so a
            // plain send() would sit in the queue until a worker runs. sendNow
            // delivers immediately so the admin gets the test straight away.
            \Illuminate\Support\Facades\Mail::to($me->email)->sendNow(
                new \App\Mail\TemplatedMessage($subject, $body, [], null, null, null, null, null, null, null, null, true)
            );

            return back()->with('success', "Test of “{$data['template_key']}” sent to {$me->email}.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Email automation test failed', ['error' => $e->getMessage()]);

            return back()->withErrors(['error' => 'Could not send the test email: '.$e->getMessage()]);
        }
    }
}
