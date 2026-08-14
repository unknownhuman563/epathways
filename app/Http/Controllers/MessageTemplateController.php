<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\MessageTemplate;
use App\Models\TemplateFolder;
use App\Models\User;
use App\Services\CommunicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
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
        ['name' => 'event_name', 'description' => 'Event title (event_registration template)'],
        ['name' => 'event_date', 'description' => 'Event date (event_registration template)'],
        ['name' => 'event_time', 'description' => 'Event time (event_registration template)'],
        ['name' => 'event_location', 'description' => 'Event location (event_registration template)'],
    ];

    public function index(Request $request)
    {
        $ctx = $this->context($request);

        // Templates are a shared library — every portal (admin + each
        // department) sees the full set and may use/edit any of them.
        // Folders (also shared) let staff group them; grouping happens
        // client-side off each template's folder_id.
        return inertia($ctx['listComponent'], [
            'templates' => MessageTemplate::query()->orderBy('name')->get()->map(fn (MessageTemplate $t) => [
                'id' => $t->id, 'key' => $t->key, 'name' => $t->name,
                'department' => $t->department, 'channels' => $t->channels ?? [],
                'is_active' => $t->is_active, 'folder_id' => $t->folder_id,
                'updated_at' => optional($t->updated_at)?->toIso8601String(),
            ]),
            'folders' => TemplateFolder::orderBy('name')->get(['id', 'name']),
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
            'brandingOptions' => $this->brandingOptions(),
            'fixedDepartment' => $ctx['department'],
            'defaultChannel' => $request->query('channel'),
            // Carried through the New-template form so a template created from
            // inside a folder is saved into that folder.
            'defaultFolderId' => $request->query('folder_id'),
        ]);
    }

    public function show(Request $request, $id)
    {
        $ctx = $this->context($request);
        $template = MessageTemplate::findOrFail($id);
        $this->authorizeTemplate($ctx['department'], $template);

        // Expose public URLs for the optional branding images so the editor
        // can preview whatever is already saved.
        $template->banner_image_url = $template->banner_image ? Storage::disk('public')->url($template->banner_image) : null;
        $template->footer_image_url = $template->footer_image ? Storage::disk('public')->url($template->footer_image) : null;

        // The body is now rich HTML. Legacy templates were authored in Markdown
        // — convert them so they load formatted in the editor (and re-save as
        // HTML going forward).
        if ($template->email_body && ! preg_match('/<[a-z][\s\S]*>/i', $template->email_body)) {
            $template->email_body = Str::markdown($template->email_body);
        }

        return inertia($ctx['editorComponent'], [
            'template' => $template,
            'standardVariables' => self::STANDARD_VARIABLES,
            'basePath' => $ctx['basePath'],
            'departmentOptions' => $ctx['departmentOptions'],
            'brandingOptions' => $this->brandingOptions(),
            'fixedDepartment' => $ctx['department'],
            'defaultChannel' => null,
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
            'folder_id' => ['nullable', 'integer', 'exists:template_folders,id'],
            ...$this->bodyRules(),
            ...$this->imageRules(),
        ], ['key.regex' => 'Key must be lowercase letters, numbers and underscores only.']);

        $this->applyImages($request, $data, null);
        $data['email_body'] = $this->sanitizeBody($data['email_body'] ?? null);
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

        // Key stays immutable (code references it). Department is editable in the
        // admin cross-department context only — portal staff keep their own.
        $data = $request->validate([...$this->bodyRules(), ...$this->imageRules()]);

        // Department is editable from every portal now. Guard key+department
        // uniqueness when moving a template between scopes.
        $department = $this->resolveStoreDepartment($request, $ctx['department']);
        $clash = MessageTemplate::where('key', $template->key)
            ->where('department', $department)
            ->where('id', '!=', $template->id)
            ->exists();
        if ($clash) {
            return back()->withErrors([
                'department' => "A '{$template->key}' template already exists in that scope.",
            ]);
        }
        $data['department'] = $department;

        $this->applyImages($request, $data, $template);
        $data['email_body'] = $this->sanitizeBody($data['email_body'] ?? null);
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
     * Create a folder. Optionally move a set of templates into it in the same
     * step — the "select templates → group into a new folder" flow. Folders
     * are shared/global, so no department scoping here.
     */
    public function storeFolder(Request $request)
    {
        $this->context($request); // gates access via the route's portal:* middleware

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'template_ids' => ['array'],
            'template_ids.*' => ['integer', 'exists:message_templates,id'],
        ]);

        $folder = TemplateFolder::create([
            'name' => $data['name'],
            'created_by' => $request->user()->id,
        ]);

        if (! empty($data['template_ids'])) {
            MessageTemplate::whereIn('id', $data['template_ids'])->update(['folder_id' => $folder->id]);
        }

        return back()->with('success', 'Folder created.');
    }

    public function updateFolder(Request $request, $id)
    {
        $this->context($request);
        $folder = TemplateFolder::findOrFail($id);

        $folder->update($request->validate([
            'name' => ['required', 'string', 'max:120'],
        ]));

        return back()->with('success', 'Folder renamed.');
    }

    /**
     * Delete a folder. Its templates are kept — folder_id is nulled by the
     * FK's nullOnDelete, so they return to the ungrouped root.
     */
    public function destroyFolder(Request $request, $id)
    {
        $this->context($request);
        TemplateFolder::findOrFail($id)->delete();

        return back()->with('success', 'Folder deleted. Its templates moved to the root.');
    }

    /**
     * Move templates into a folder, or out to the root when folder_id is null.
     * Backs the checkbox "Move to folder" action and per-row remove.
     */
    public function moveTemplates(Request $request)
    {
        $this->context($request);

        $data = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:message_templates,id'],
            'folder_id' => ['nullable', 'integer', 'exists:template_folders,id'],
        ]);

        MessageTemplate::whereIn('id', $data['ids'])->update(['folder_id' => $data['folder_id'] ?? null]);

        return back()->with('success', 'Templates moved.');
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
            // Department picker is now available in every portal, not just the
            // admin area — staff can scope a template to shared or any team.
            'departmentOptions' => $this->departmentOptions(),
            'scopeLabel' => ucfirst($department),
        ];
    }

    /**
     * Department for a new template: forced to their own for staff, chosen for
     * admins ('' = shared/global). Never null — '' is the shared sentinel.
     */
    private function resolveStoreDepartment(Request $request, ?string $actingDepartment): string
    {
        $request->validate([
            'department' => ['nullable', Rule::in(array_merge([''], MessageTemplate::DEPARTMENTS))],
        ]);

        // The selector now shows in every portal, so honour an explicitly
        // submitted department; otherwise default to the acting portal's own
        // department (or shared in the admin area).
        if ($request->has('department')) {
            return (string) ($request->input('department') ?: '');
        }

        return (string) ($actingDepartment ?: '');
    }

    /**
     * Templates are a shared library across all portals — any staff member
     * (admin or department) may view, edit, and delete any template. Kept as a
     * hook so the call sites stay unchanged if per-department rules return.
     */
    private function authorizeTemplate(?string $actingDepartment, MessageTemplate $template): void
    {
        // no-op — fully shared
    }

    /**
     * Email branding presets for the editor's picker (Default + each portal),
     * each carrying the banner + CTA preview URLs that would actually be used
     * (a portal without its own asset resolves to the default artwork), so the
     * editor can show a live preview of the selected branding.
     */
    private function brandingOptions(): array
    {
        $default = config('email_branding.default', []);

        return collect(config('email_branding', []))
            ->map(function ($cfg, $key) use ($default) {
                $banner = ($cfg['banner'] ?? null) && is_file(public_path($cfg['banner'])) ? $cfg['banner'] : ($default['banner'] ?? null);
                $footer = ($cfg['footer'] ?? null) && is_file(public_path($cfg['footer'])) ? $cfg['footer'] : ($default['footer'] ?? null);

                return [
                    'value' => $key,
                    'label' => $cfg['label'] ?? ucfirst($key),
                    'banner_url' => $banner && is_file(public_path($banner)) ? asset($banner) : null,
                    'footer_url' => $footer && is_file(public_path($footer)) ? asset($footer) : null,
                ];
            })
            ->values()->all();
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
            // Optional per-template sender (must be a verified address in the
            // mail provider). Null = the app default MAIL_FROM.
            'from_email' => ['nullable', 'email', 'max:255'],
            'from_name' => ['nullable', 'string', 'max:120'],
            // Per-portal banner/CTA preset (config/email_branding.php).
            'branding' => ['nullable', Rule::in(array_keys(config('email_branding', ['default' => []])))],
            // Comma-separated addresses copied on every send.
            'cc' => ['nullable', 'string', 'max:1000'],
            'bcc' => ['nullable', 'string', 'max:1000'],
            // Rich HTML from the editor is more verbose than the old Markdown.
            'email_body' => ['nullable', 'string', 'max:65000'],
            'sms_body' => ['nullable', 'string', 'max:1600'],
            'is_active' => ['boolean'],
        ];
    }

    /**
     * Strip dangerous elements/attributes from the rich-text body. The editor
     * only emits safe HTML and authors are trusted staff, but this is a cheap
     * defense-in-depth pass before the HTML is stored and later emailed.
     */
    private function sanitizeBody(?string $html): ?string
    {
        if ($html === null || $html === '') {
            return $html;
        }

        $html = preg_replace('#<(script|style|iframe|object|embed)\b[^>]*>.*?</\1>#is', '', $html);
        $html = preg_replace('#<(script|style|iframe|object|embed)\b[^>]*/?>#i', '', $html);
        $html = preg_replace('#\son\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)#i', '', $html);
        $html = preg_replace('#(href|src)\s*=\s*(["\'])\s*javascript:[^"\']*\2#i', '$1="#"', $html);

        return $html;
    }

    /** Optional email-shell branding images (banner header + footer CTA). */
    private function imageRules(): array
    {
        return [
            'banner_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:4096'],
            'footer_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp,gif', 'max:4096'],
            'remove_banner' => ['nullable', 'boolean'],
            'remove_footer' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Resolve the two optional branding images into stored paths on $data.
     * A new upload replaces (and deletes) the old file; a `remove_*` flag
     * clears it; otherwise the column is left untouched. The transient
     * validation keys never reach the model.
     */
    private function applyImages(Request $request, array &$data, ?MessageTemplate $existing): void
    {
        $map = ['banner_image' => 'templates/banners', 'footer_image' => 'templates/footers'];

        foreach ($map as $field => $dir) {
            $removeFlag = 'remove_'.str_replace('_image', '', $field);

            if ($request->hasFile($field)) {
                if ($existing?->{$field}) {
                    Storage::disk('public')->delete($existing->{$field});
                }
                $data[$field] = $request->file($field)->store($dir, 'public');
            } elseif ($request->boolean($removeFlag)) {
                if ($existing?->{$field}) {
                    Storage::disk('public')->delete($existing->{$field});
                }
                $data[$field] = null;
            } else {
                unset($data[$field]);
            }

            unset($data[$removeFlag]);
        }
    }
}
