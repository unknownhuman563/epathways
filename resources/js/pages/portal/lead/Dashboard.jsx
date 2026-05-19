import { Head } from "@inertiajs/react";
import {
    User, Mail, Phone, MapPin, Hash, Calendar, FileText, MessageCircle, Clock,
} from "lucide-react";

const fmtDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString("en-NZ", { day: "numeric", month: "long", year: "numeric" }) : "—";

const STAGE_CHIP = "bg-[#436235]/10 text-[#436235] border-[#436235]/20";
const STATUS_CHIP = {
    New: "bg-blue-100 text-blue-700 border-blue-200",
    Contacted: "bg-amber-100 text-amber-700 border-amber-200",
    Qualified: "bg-purple-100 text-purple-700 border-purple-200",
    Processing: "bg-indigo-100 text-indigo-700 border-indigo-200",
    Closed: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
const statusChip = (s) => STATUS_CHIP[s] || "bg-gray-100 text-gray-600 border-gray-200";

export default function LeadDashboard({ lead }) {
    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-12">
            <Head title="My ePathways Portal" />

            {/* Hello */}
            <div>
                <h1 className="text-2xl sm:text-3xl font-medium text-[#282728] tracking-tight">
                    Welcome back, {lead.first_name}.
                </h1>
                <p className="text-sm text-gray-500 font-light mt-1.5">
                    Your portal home. We&apos;ll add documents, messages, and progress tracking here as we work together.
                </p>
            </div>

            {/* Status pill row */}
            <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] border ${statusChip(lead.status)}`}>
                    <Clock size={12} strokeWidth={2.5} /> {lead.status || "New"}
                </span>
                {lead.stage && (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] border ${STAGE_CHIP}`}>
                        {lead.stage}
                    </span>
                )}
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.18em] bg-gray-50 text-gray-500 border border-gray-200">
                    <Hash size={11} strokeWidth={2.5} /> {lead.lead_id}
                </span>
            </div>

            {/* My details card */}
            <section className="bg-white rounded-2xl border border-[#282728]/15 overflow-hidden">
                <div className="px-6 py-4 border-b border-[#282728]/10 flex items-center gap-2.5">
                    <User size={16} className="text-[#436235]" />
                    <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#282728]">My details</h2>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#282728]/10">
                    <DetailRow icon={<User size={14} />} label="Full name" value={`${lead.first_name} ${lead.last_name}`.trim()} />
                    <DetailRow icon={<Mail size={14} />} label="Email"     value={lead.email || "—"} />
                    <DetailRow icon={<Phone size={14} />} label="Phone"    value={lead.phone || "—"} />
                    <DetailRow icon={<MapPin size={14} />} label="Country" value={lead.residence_country || "—"} />
                    <DetailRow icon={<Calendar size={14} />} label="Joined ePathways" value={fmtDate(lead.created_at)} fullWidth />
                </dl>
            </section>

            {/* Coming soon */}
            <section className="bg-[#f7f8f6] rounded-2xl border border-[#282728]/15 p-7 sm:p-9">
                <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em] mb-3">Coming next</p>
                <h3 className="text-xl font-medium text-[#282728] tracking-tight mb-2">More tools, soon.</h3>
                <p className="text-sm text-gray-500 font-light leading-relaxed mb-6 max-w-xl">
                    Your portal will soon let you upload documents your adviser requests, see the status of each, and message us directly. For now, our team has full visibility on your record.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FeatureCard icon={<FileText size={16} />} title="Document uploads" body="Upload passport, transcripts, IELTS and other documents your adviser asks for." />
                    <FeatureCard icon={<MessageCircle size={16} />} title="Direct messaging" body="Reach your assigned adviser without leaving the portal." />
                </div>
            </section>
        </div>
    );
}

function DetailRow({ icon, label, value, fullWidth = false }) {
    return (
        <div className={`bg-white px-6 py-5 flex items-start gap-4 ${fullWidth ? "sm:col-span-2" : ""}`}>
            <div className="w-9 h-9 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-medium text-[#282728] truncate">{value}</p>
            </div>
        </div>
    );
}

function FeatureCard({ icon, title, body }) {
    return (
        <div className="bg-white rounded-xl border border-[#282728]/15 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl bg-[#436235]/10 text-[#436235] flex items-center justify-center flex-shrink-0">
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-[#282728]">{title}</p>
                <p className="text-xs text-gray-500 font-light leading-relaxed mt-1">{body}</p>
            </div>
        </div>
    );
}
