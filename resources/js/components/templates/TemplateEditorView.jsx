import { useState } from "react";
import { Head, Link, router, useForm } from "@inertiajs/react";
import { ArrowLeft, Save, Trash2, Send, Mail, Smartphone } from "lucide-react";

const inp = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300";

/**
 * Shared template editor, reused by the admin area and every department
 * portal. `basePath` drives every link/submit so the same form works under
 * /admin/message-templates and /portal/<role>/email-templates.
 *
 * When `departmentOptions` is provided (admin only), a department selector is
 * shown on create. Department is immutable after creation. Portal staff never
 * see the selector — the controller forces their own department.
 */
export default function TemplateEditorView({
    template = null,
    standardVariables = [],
    basePath = "/admin/message-templates",
    departmentOptions = null,
    fixedDepartment = null,
}) {
    const editing = !!template;
    const form = useForm({
        key: template?.key ?? "",
        department: template?.department ?? fixedDepartment ?? "",
        name: template?.name ?? "",
        description: template?.description ?? "",
        channels: template?.channels ?? ["email"],
        email_subject: template?.email_subject ?? "",
        email_body: template?.email_body ?? "",
        sms_body: template?.sms_body ?? "",
        is_active: template?.is_active ?? true,
    });
    const { data, setData, errors, processing } = form;

    const [testEmail, setTestEmail] = useState("");
    const showDeptSelector = !!departmentOptions && !editing;

    const toggleChannel = (ch) =>
        setData("channels", data.channels.includes(ch) ? data.channels.filter((c) => c !== ch) : [...data.channels, ch]);

    const submit = (e) => {
        e.preventDefault();
        if (editing) form.put(`${basePath}/${template.id}`, { preserveScroll: true });
        else form.post(basePath);
    };

    const remove = () => {
        if (!window.confirm("Delete this template?")) return;
        router.delete(`${basePath}/${template.id}`);
    };

    const sendTest = () => {
        router.post(`${basePath}/${template.id}/test`, { email: testEmail || null }, { preserveScroll: true });
    };

    const smsLen = data.sms_body.length;
    const segments = Math.ceil(smsLen / 160) || 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <Head title={editing ? `Edit ${template.name}` : "New template"} />

            <Link href={basePath} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
                <ArrowLeft size={15} /> Back to templates
            </Link>

            <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <label className="block">
                                <span className="block text-xs font-semibold text-gray-600 mb-1">Key {editing && <span className="text-gray-400">(immutable)</span>}</span>
                                <input value={data.key} onChange={(e) => setData("key", e.target.value)} disabled={editing} placeholder="application_status_update" className={`${inp} ${editing ? "bg-gray-50 text-gray-500" : ""}`} />
                                {errors.key && <span className="text-xs text-rose-600">{errors.key}</span>}
                            </label>
                            <label className="block">
                                <span className="block text-xs font-semibold text-gray-600 mb-1">Name</span>
                                <input value={data.name} onChange={(e) => setData("name", e.target.value)} className={inp} />
                                {errors.name && <span className="text-xs text-rose-600">{errors.name}</span>}
                            </label>
                        </div>
                        {showDeptSelector && (
                            <label className="block">
                                <span className="block text-xs font-semibold text-gray-600 mb-1">Department</span>
                                <select value={data.department} onChange={(e) => setData("department", e.target.value)} className={inp}>
                                    {departmentOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                                {errors.department && <span className="text-xs text-rose-600">{errors.department}</span>}
                            </label>
                        )}
                        <label className="block">
                            <span className="block text-xs font-semibold text-gray-600 mb-1">Description</span>
                            <input value={data.description} onChange={(e) => setData("description", e.target.value)} className={inp} />
                        </label>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-semibold text-gray-600">Channels:</span>
                            <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" checked={data.channels.includes("email")} onChange={() => toggleChannel("email")} /> <Mail size={14} /> Email</label>
                            <label className="inline-flex items-center gap-1.5 text-sm"><input type="checkbox" checked={data.channels.includes("sms")} onChange={() => toggleChannel("sms")} /> <Smartphone size={14} /> SMS</label>
                            <label className="inline-flex items-center gap-1.5 text-sm ml-auto"><input type="checkbox" checked={data.is_active} onChange={(e) => setData("is_active", e.target.checked)} /> Active</label>
                        </div>
                    </div>

                    {data.channels.includes("email") && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Mail size={15} /> Email</h3>
                            <label className="block">
                                <span className="block text-xs font-semibold text-gray-600 mb-1">Subject</span>
                                <input value={data.email_subject} onChange={(e) => setData("email_subject", e.target.value)} className={inp} />
                            </label>
                            <label className="block">
                                <span className="block text-xs font-semibold text-gray-600 mb-1">Body (Markdown)</span>
                                <textarea value={data.email_body} onChange={(e) => setData("email_body", e.target.value)} rows={10} className={`${inp} font-mono text-xs`} />
                            </label>
                        </div>
                    )}

                    {data.channels.includes("sms") && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-2">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><Smartphone size={15} /> SMS</h3>
                            <textarea value={data.sms_body} onChange={(e) => setData("sms_body", e.target.value)} rows={3} className={`${inp}`} />
                            <p className={`text-xs ${segments > 1 ? "text-amber-600" : "text-gray-400"}`}>{smsLen} chars · {segments} segment{segments === 1 ? "" : "s"}{segments > 1 ? " (multi-segment costs more)" : ""}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button type="submit" disabled={processing} className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black flex items-center gap-2 disabled:opacity-50">
                            <Save size={15} /> {editing ? "Save changes" : "Create template"}
                        </button>
                        {editing && (
                            <button type="button" onClick={remove} className="px-4 py-2 text-rose-600 text-sm font-medium hover:bg-rose-50 rounded-xl flex items-center gap-2">
                                <Trash2 size={15} /> Delete
                            </button>
                        )}
                    </div>
                </div>

                {/* Sidebar: variables + test send */}
                <div className="space-y-5">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Variables</h3>
                        <p className="text-[11px] text-gray-400 mb-2">Use <code>{"{{name}}"}</code> in any field.</p>
                        <ul className="space-y-1.5">
                            {standardVariables.map((v) => (
                                <li key={v.name} className="text-xs">
                                    <code className="bg-gray-100 rounded px-1 py-0.5 text-gray-700">{`{{${v.name}}}`}</code>
                                    <span className="text-gray-400 block mt-0.5">{v.description}</span>
                                </li>
                            ))}
                            {(template?.variables_documented ?? []).filter((v) => !standardVariables.some((s) => s.name === v.name)).map((v) => (
                                <li key={v.name} className="text-xs">
                                    <code className="bg-amber-50 rounded px-1 py-0.5 text-amber-700">{`{{${v.name}}}`}</code>
                                    <span className="text-gray-400 block mt-0.5">{v.description}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {editing && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Send test</h3>
                            <input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="you@example.com (or blank = your email)" className={`${inp} mb-2`} />
                            <button type="button" onClick={sendTest} className="w-full px-3 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 flex items-center justify-center gap-2">
                                <Send size={14} /> Send test
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
}
