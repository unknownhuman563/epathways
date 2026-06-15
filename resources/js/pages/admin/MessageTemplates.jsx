import { Head, Link, router } from "@inertiajs/react";
import { MessageSquare, Plus, Mail, Smartphone } from "lucide-react";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function MessageTemplates({ templates = [] }) {
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Head title="Message Templates" />

            <header className="flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-gray-700" /> Message Templates
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Reusable email &amp; SMS templates the system sends to leads.</p>
                </div>
                <Link href="/admin/message-templates/create" className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-black flex items-center gap-2">
                    <Plus size={15} /> New template
                </Link>
            </header>

            <div className="bg-white rounded-3xl border border-gray-50 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-y border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <th className="px-6 py-3">Template</th>
                                <th className="px-6 py-3">Key</th>
                                <th className="px-6 py-3">Channels</th>
                                <th className="px-6 py-3">Active</th>
                                <th className="px-6 py-3">Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {templates.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-400">No templates yet.</td></tr>
                            ) : (
                                templates.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50/40 cursor-pointer" onClick={() => router.visit(`/admin/message-templates/${t.id}`)}>
                                        <td className="px-6 py-3 font-semibold text-gray-900 text-sm">{t.name}</td>
                                        <td className="px-6 py-3"><code className="text-xs bg-gray-100 rounded px-1.5 py-0.5 text-gray-600">{t.key}</code></td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-1.5">
                                                {t.channels.includes("email") && <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5"><Mail size={11} /> Email</span>}
                                                {t.channels.includes("sms") && <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5"><Smartphone size={11} /> SMS</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${t.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                                                {t.is_active ? "Active" : "Inactive"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{fmtDate(t.updated_at)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
