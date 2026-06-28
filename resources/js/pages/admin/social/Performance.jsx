import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import { BarChart3, Eye, Users, Heart, MousePointerClick, UserPlus, RefreshCw } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';
import { social } from '@/services/social';
import { Skeleton, PlatformIcon, EmptyState } from '@/components/social/atoms';

const RANGES = [
    { key: '7', label: 'Last 7 days', days: 7 },
    { key: '30', label: 'Last 30 days', days: 30 },
    { key: '90', label: 'Last 90 days', days: 90 },
];

const fmtNum = (n) => (n ?? 0).toLocaleString('en-NZ');
const dateStr = (d) => d.toISOString().slice(0, 10);

function Tile({ icon, label, value, accent }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl mb-3 ${accent}`}>{icon}</div>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
        </div>
    );
}

export default function PerformancePage() {
    const [range, setRange] = useState('30');
    const [data, setData] = useState(null);

    const load = (days) => {
        setData(null);
        const to = new Date();
        const from = new Date();
        from.setDate(from.getDate() - days);
        social.performance({ fromDate: dateStr(from), toDate: dateStr(to) }).then(
            setData,
            () => { setData({ posts: [], totals: {}, leads: 0 }); toast.error('Could not load performance'); },
        );
    };

    useEffect(() => { load(Number(range)); }, [range]);

    const t = data?.totals || {};

    return (
        <SocialLayout>
            <Head title="Performance · Social" />

            <div className="flex items-center gap-2 mb-5 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart3 size={18} /> Performance</h1>
                <div className="ml-auto flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    {RANGES.map((r) => (
                        <button key={r.key} onClick={() => setRange(r.key)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${range === r.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-800'}`}>{r.label}</button>
                    ))}
                </div>
                <button onClick={() => load(Number(range))} className="text-gray-400 hover:text-gray-700" title="Refresh"><RefreshCw size={15} /></button>
            </div>

            {/* Summary tiles */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                {data === null ? (
                    [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
                ) : (
                    <>
                        <Tile icon={<Eye size={16} className="text-blue-600" />} accent="bg-blue-50" label="Impressions" value={fmtNum(t.impressions)} />
                        <Tile icon={<Users size={16} className="text-violet-600" />} accent="bg-violet-50" label="Reach" value={fmtNum(t.reach)} />
                        <Tile icon={<Heart size={16} className="text-rose-600" />} accent="bg-rose-50" label="Engagement" value={fmtNum(t.engagement)} />
                        <Tile icon={<MousePointerClick size={16} className="text-amber-600" />} accent="bg-amber-50" label="Clicks" value={fmtNum(t.clicks)} />
                        <Tile icon={<UserPlus size={16} className="text-emerald-600" />} accent="bg-emerald-50" label="Leads" value={fmtNum(data.leads)} />
                    </>
                )}
            </div>

            {/* Top posts */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900">Top posts {data?.posts ? `(${data.posts.length})` : ''}</h2>
                </div>
                {data === null ? (
                    <div className="p-5 space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}</div>
                ) : (data.posts || []).length === 0 ? (
                    <EmptyState icon={<BarChart3 size={20} className="text-gray-500" />} title="No post analytics yet" body="Once posts go live through Zernio, their performance shows here." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="px-5 py-2.5">Post</th>
                                    <th className="px-5 py-2.5 text-right">Impr.</th>
                                    <th className="px-5 py-2.5 text-right">Reach</th>
                                    <th className="px-5 py-2.5 text-right">Eng.</th>
                                    <th className="px-5 py-2.5 text-right">Clicks</th>
                                    <th className="px-5 py-2.5 text-right">Eng. rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.posts.map((p) => (
                                    <tr key={p.post_id} className="hover:bg-gray-50/40">
                                        <td className="px-5 py-2.5">
                                            <div className="flex items-center gap-2 max-w-md">
                                                <PlatformIcon id={p.platform} size={14} />
                                                <span className="text-sm text-gray-800 truncate">{p.content || '—'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-2.5 text-right text-sm tabular-nums">{fmtNum(p.impressions)}</td>
                                        <td className="px-5 py-2.5 text-right text-sm tabular-nums">{fmtNum(p.reach)}</td>
                                        <td className="px-5 py-2.5 text-right text-sm tabular-nums">{fmtNum((p.likes || 0) + (p.comments || 0) + (p.shares || 0))}</td>
                                        <td className="px-5 py-2.5 text-right text-sm tabular-nums">{fmtNum(p.clicks)}</td>
                                        <td className="px-5 py-2.5 text-right text-sm tabular-nums text-gray-600">{p.engagement_rate ?? 0}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </SocialLayout>
    );
}
