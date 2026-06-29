<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\User;
use App\Services\CommunicationService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * CRUD for message templates, shared by the admin area and every department
 * portal. The scope is driven by the ROUTE: /admin/message-templates is the
 * cross-department admin view (manages all templates + the shared set), while
 * /portal/<role>/email-templates is scoped to that one department for whoever
 * opens it — department staff or an admin browsing the portal. The portal:*
 * middleware on each route enforces who may reach it.
 */
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
        ['name' => 'status', 'description' => 'Application status (passed when staff send an update)'],
        ['name' => 'status_detail', 'description' => 'Optional note describing the status change'],
    ];

    public function index(Request $request)
    {
        $ctx = $this->context($request);
        $query = MessageTemplate::query();
        if ($ctx['department'] !== null) {
            $query->forDepartment($ctx['department']);
        }

        return inertia($ctx['listComponent'], [
            'templates' => $query->orderBy('name')->get()->map(fn (MessageTemplate $t) => [
                'id' => $t->id, 'key' => $t->key, 'name' => $t->name,
                'department' => $t->department, 'channels' => $t->channels ?? [],
                'is_active' => $t->is_active,
                'updated_at' => optional($t->updated_at)?->toIso8601String(),
            ]),
            'basePath' => $ctx['basePath'],
            'scopeLabel' => $ctx['scopeLabel'],
        ]);
    }

    public function create(Request $request)
    {
        $ctx = $this->context($request);

        return inertia($ctx['editorComponent'], [
            'template' => null,
            'standardVariables' => self::STANDARD_VARIABLES,
            'basePath' => $ctx['basePath'],
            'departmentOptions' => $ctx['departmentOptions'],
            'fixedDepartment' => $ctx['department'],
        ]);
    }

    public function show(Request $request, $id)
    {
        $ctx = $this->context($request);
        $template = MessageTemplate::findOrFail($id);
        $this->authorizeTemplate($ctx['department'], $template);

        return inertia($ctx['editorComponent'], [
            'template' => $template,
            'standardVariables' => self::STANDARD_VARIABLES,
            'basePath' => $ctx['basePath'],
            'departmentOptions' => $ctx['departmentOptions'],
            'fixedDepartment' => $ctx['department'],
        ]);
    }

    public function store(Request $request)
    {
        $ctx = $this->context($request);
        $department = $this->resolveStoreDepartment($request, $ctx['department']);

        $data = $request->validate([
            'key' => [
                'required', 'string', 'max:80', 'regex:/^[a-z0-9_]+$/',
                Rule::unique('message_templates', 'key')->where(fn ($q) => $q->where('department', $department)),
            ],
            ...$this->bodyRules(),
        ], ['key.regex' => 'Key must be lowercase letters, numbers and underscores only.']);

        $data['department'] = $department;
        $data['created_by'] = $request->user()->id;
        $template = MessageTemplate::create($data);

        return redirect()->to($ctx['basePath'].'/'.$template->id)->with('success', 'Template created.');
    }

    public function update(Request $request, $id)
    {
        $ctx = $this->context($request);
        $template = MessageTemplate::findOrFail($id);
        $this->authorizeTemplate($ctx['department'], $template);

        // Key and department are immutable after creation — code references them.
        $data = $request->validate($this->bodyRules());
        $template->update($data);

        return back()->with('success', 'Template saved.');
    }

    public function destroy(Request $request, $id)
    {
        $ctx = $this->context($request);
        $template = MessageTemplate::findOrFail($id);
        $this->authorizeTemplate($ctx['department'], $template);
        $template->delete();

        return redirect()->to($ctx['basePath'])->with('success', 'Template removed.');
    }

    /**
     * Send a test of this template to a staff-supplied email/phone (or the
     * current user), using a synthetic sample lead for the variables.
     */
    public function sendTest(Request $request, $id, CommunicationService $comms)
    {
        $ctx = $this->context($request);
        $template = MessageTemplate::findOrFail($id);
        $this->authorizeTemplate($ctx['department'], $template);

        $validated = $request->validate([
            'email' => 'nullable|email',
            'phone' => 'nullable|string|max:40',
        ]);

        if (! $template->is_active) {
            return back()->with('error', 'Activate the template before sending a test.');
        }

        $user = $request->user();
        $sample = new Lead([
            'first_name' => $user->name,
            'last_name' => '',
            'email' => $validated['email'] ?? $user->email,
            'phone' => $validated['phone'] ?? null,
        ]);
        $sample->tracking_code = 'SAMPLE-CODE';

        // Sample values cover every templated variable so any template renders.
        $comms->sendTemplate($template, $sample, [
            'document_name' => 'Sample Document.pdf',
            'reason' => 'This is a sample reason.',
            'status' => 'Under Review',
            'status_detail' => 'Your application is currently being reviewed by our team.',
        ]);

        return back()->with('success', 'Test message sent.');
    }

    /**
     * Resolve the acting view context (component names, base path, scoped
     * department, and the admin-only department list) from the ROUTE, not the
     * user. The /portal/<role>/... routes are scoped to that department for
     * everyone (including admins browsing the portal); /admin/... is the
     * cross-department admin view. Access itself is gated by the portal:*
     * middleware on each route.
     *
     * @return array{department: ?string, basePath: string, listComponent: string, editorComponent: string, departmentOptions: ?array, scopeLabel: string}
     */
    private function context(Request $request): array
    {
        $name = (string) $request->route()?->getName();
        $department = null;
        if (str_starts_with($name, 'portal.')) {
            $candidate = explode('.', $name)[1] ?? null;
            if (in_array($candidate, MessageTemplate::DEPARTMENTS, true)) {
                $department = $candidate;
            }
        }

        if ($department === null) {
            return [
                'department' => null,
                'basePath' => '/admin/message-templates',
                'listComponent' => 'admin/MessageTemplates',
                'editorComponent' => 'admin/MessageTemplateEditor',
                'departmentOptions' => $this->departmentOptions(),
                'scopeLabel' => 'All departments',
            ];
        }

        return [
            'department' => $department,
            'basePath' => "/portal/{$department}/email-templates",
            'listComponent' => "portal/{$department}/EmailTemplates",
            'editorComponent' => "portal/{$department}/EmailTemplateEditor",
            'departmentOptions' => null,
            'scopeLabel' => ucfirst($department),
        ];
    }

    /**
     * Department for a new template: forced to their own for staff, chosen for
     * admins ('' = shared/global). Never null — '' is the shared sentinel.
     */
    private function resolveStoreDepartment(Request $request, ?string $actingDepartment): string
    {
        if ($actingDepartment !== null) {
            return $actingDepartment;
        }

        $request->validate([
            'department' => ['nullable', Rule::in(array_merge([''], MessageTemplate::DEPARTMENTS))],
        ]);

        return (string) ($request->input('department') ?: '');
    }

    /** Staff may only touch their own department's templates; admins, any. */
    private function authorizeTemplate(?string $actingDepartment, MessageTemplate $template): void
    {
        if ($actingDepartment !== null && $template->department !== $actingDepartment) {
            abort(403, 'This template belongs to another department.');
        }
    }

    /** Admin-only department picker: a blank shared option plus each portal. */
    private function departmentOptions(): array
    {
        return array_merge(
            [['value' => '', 'label' => 'Shared (all departments)']],
            array_map(fn ($d) => ['value' => $d, 'label' => ucfirst($d)], MessageTemplate::DEPARTMENTS),
        );
    }

    private function bodyRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:191'],
            'description' => ['nullable', 'string', 'max:1000'],
            'channels' => ['array'],
            'channels.*' => [Rule::in(MessageTemplate::CHANNELS)],
            'email_subject' => ['nullable', 'string', 'max:255'],
            'email_body' => ['nullable', 'string', 'max:20000'],
            'sms_body' => ['nullable', 'string', 'max:1600'],
            'is_active' => ['boolean'],
        ];
    }
}
