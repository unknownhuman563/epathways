<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Services\CommunicationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class MessageTemplateController extends Controller
{
    /** Standard variables shown in the editor's reference panel. */
    private const STANDARD_VARIABLES = [
        ['name' => 'first_name', 'description' => "Lead's first name"],
        ['name' => 'last_name', 'description' => "Lead's last name"],
        ['name' => 'full_name', 'description' => "Lead's full name"],
        ['name' => 'email', 'description' => "Lead's email"],
        ['name' => 'phone', 'description' => "Lead's phone"],
        ['name' => 'tracker_url', 'description' => 'Link to the lead /track/{code} page'],
        ['name' => 'assigned_staff_name', 'description' => 'Assigned staff member, or "the ePathways team"'],
    ];

    public function index()
    {
        return inertia('admin/MessageTemplates', [
            'templates' => MessageTemplate::orderBy('name')->get()->map(fn (MessageTemplate $t) => [
                'id' => $t->id, 'key' => $t->key, 'name' => $t->name,
                'channels' => $t->channels ?? [], 'is_active' => $t->is_active,
                'updated_at' => optional($t->updated_at)?->toIso8601String(),
            ]),
        ]);
    }

    public function create()
    {
        return inertia('admin/MessageTemplateEditor', [
            'template' => null,
            'standardVariables' => self::STANDARD_VARIABLES,
        ]);
    }

    public function show($id)
    {
        $t = MessageTemplate::findOrFail($id);

        return inertia('admin/MessageTemplateEditor', [
            'template' => $t,
            'standardVariables' => self::STANDARD_VARIABLES,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'key' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9_]+$/', 'unique:message_templates,key'],
            ...$this->bodyRules(),
        ], ['key.regex' => 'Key must be lowercase letters, numbers and underscores only.']);

        $data['created_by'] = $request->user()->id;
        $template = MessageTemplate::create($data);

        return redirect()->route('admin.message-templates.show', $template->id)
            ->with('success', 'Template created.');
    }

    public function update(Request $request, $id)
    {
        $template = MessageTemplate::findOrFail($id);

        // Key is immutable after creation — code references it.
        $data = $request->validate($this->bodyRules());
        $template->update($data);

        return back()->with('success', 'Template saved.');
    }

    public function destroy($id)
    {
        MessageTemplate::findOrFail($id)->delete();

        return redirect()->route('admin.message-templates')->with('success', 'Template removed.');
    }

    /**
     * Send a test of this template to a staff-supplied email/phone (or the
     * current user), using a synthetic sample lead for the variables.
     */
    public function sendTest(Request $request, $id, CommunicationService $comms)
    {
        $template = MessageTemplate::findOrFail($id);
        $validated = $request->validate([
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:40',
        ]);

        $user = $request->user();
        $sample = new Lead([
            'first_name' => $user->name,
            'last_name'  => '',
            'email'      => $validated['email'] ?? $user->email,
            'phone'      => $validated['phone'] ?? null,
        ]);
        $sample->tracking_code = 'SAMPLE-CODE';

        if (! $template->is_active) {
            return back()->with('error', 'Activate the template before sending a test.');
        }

        $comms->sendTemplated($template->key, $sample, [
            'document_name' => 'Sample Document.pdf',
            'reason'        => 'This is a sample reason.',
        ]);

        return back()->with('success', 'Test message sent.');
    }

    private function bodyRules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:1000'],
            'channels'    => ['array'],
            'channels.*'  => [Rule::in(MessageTemplate::CHANNELS)],
            'email_subject' => ['nullable', 'string', 'max:255'],
            'email_body'  => ['nullable', 'string', 'max:20000'],
            'sms_body'    => ['nullable', 'string', 'max:1600'],
            'is_active'   => ['boolean'],
        ];
    }
}
