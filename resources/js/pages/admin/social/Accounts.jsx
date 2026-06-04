import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import { Plus, Trash2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import SocialLayout from '@/pages/admin/social/SocialLayout';
import { social } from '@/services/social';
import { Skeleton, PlatformIcon, EmptyState } from '@/components/social/atoms';
import { PLATFORMS } from '@/components/social/constants';

// ─── Helpers ────────────────────────────────────────────────────────────

function platformLabel(id) {
    return PLATFORMS.find((p) => p.id === id)?.label || id;
}

function formatLastPosted(iso) {
    if (!iso) return null;
    try {
        return new Date(iso).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return null;
    }
}

// ─── Status pill ────────────────────────────────────────────────────────

function StatusPill({ status }) {
    if (status === 'needs_reauth') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                <AlertCircle size={11} />
                Needs reauth
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 size={11} />
            Active
        </span>
    );
}

// ─── Skeleton row ───────────────────────────────────────────────────────

function SkeletonRow() {
    return (
        <div className="px-6 py-4 flex items-center gap-4">
            <Skeleton className="h-5 w-5 rounded-full" />
            <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full ml-2" />
            <Skeleton className="h-3 w-24 ml-auto" />
            <Skeleton className="h-7 w-7 rounded-lg" />
        </div>
    );
}

// ─── Modal shell ────────────────────────────────────────────────────────

function Modal({ title, onClose, children }) {
    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                        <X size={14} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────

export default function Accounts() {
    const [accounts, setAccounts] = useState(null); // null = loading, [] = empty
    const [connectOpen, setConnectOpen] = useState(false);
    const [disconnectTarget, setDisconnectTarget] = useState(null);
    const [connectingPlatform, setConnectingPlatform] = useState(null);

    const refetch = () => {
        social.listAccounts().then(
            (r) => setAccounts(r?.accounts || []),
            () => {
                setAccounts([]);
                toast.error('Could not load accounts');
            }
        );
    };

    useEffect(() => {
        refetch();
    }, []);

    const onConnect = async (platform) => {
        setConnectingPlatform(platform);
        try {
            const res = await social.startOauth(platform);
            const url = res?.url;
            if (!url) throw new Error('No authorisation URL returned');
            window.open(url, 'social_oauth', 'width=520,height=640');
            toast.success(`Authorising with ${platform}…`);
            setConnectOpen(false);
            // One delayed refetch handles the instant-completion case for MVP.
            setTimeout(() => {
                social.listAccounts().then(
                    (r) => setAccounts(r?.accounts || []),
                    () => { /* silent — user can refresh manually */ }
                );
            }, 2000);
        } catch (err) {
            toast.error(err?.message || `Could not start ${platform} authorisation`);
        } finally {
            setConnectingPlatform(null);
        }
    };

    const onConfirmDisconnect = async () => {
        const account = disconnectTarget;
        if (!account) return;
        setDisconnectTarget(null);

        // Optimistic remove.
        const snapshot = accounts;
        setAccounts((prev) => (prev || []).filter((a) => a.id !== account.id));

        try {
            await social.disconnectAccount(account.id);
            toast.success(`Disconnected ${account.handle}`);
        } catch (err) {
            // Restore on failure.
            setAccounts(snapshot);
            toast.error(err?.message || 'Could not disconnect account');
        }
    };

    const count = accounts?.length ?? 0;

    return (
        <SocialLayout>
            <Head title="Accounts · Social" />

            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                    <PlatformIcon id="globe" size={16} />
                    <h2 className="text-sm font-bold text-gray-900">Connected accounts</h2>
                    {accounts !== null && (
                        <span className="inline-flex items-center justify-center min-w-[1.5rem] px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[11px] font-bold tabular-nums">
                            {count}
                        </span>
                    )}

                    <button
                        type="button"
                        onClick={() => setConnectOpen(true)}
                        className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                    >
                        <Plus size={14} />
                        Connect new account
                    </button>
                </div>

                {accounts === null ? (
                    <div className="divide-y divide-gray-100">
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                    </div>
                ) : accounts.length === 0 ? (
                    <EmptyState
                        icon={<Plus size={20} className="text-gray-500" />}
                        title="No accounts connected yet"
                        body="Click '+ Connect new account' above to get started."
                    />
                ) : (
                    <div className="divide-y divide-gray-100">
                        {accounts.map((account) => {
                            const lastPosted = formatLastPosted(account.last_post_at);
                            return (
                                <div key={account.id} className="px-6 py-4 flex items-center gap-4">
                                    <PlatformIcon id={account.platform} size={18} />

                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-900">{account.handle}</span>
                                        <span className="text-xs text-gray-600">{platformLabel(account.platform)}</span>
                                    </div>

                                    <StatusPill status={account.status} />

                                    {lastPosted && (
                                        <span className="ml-auto text-xs text-gray-600 tabular-nums">
                                            Last posted {lastPosted}
                                        </span>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => setDisconnectTarget(account)}
                                        className={`${lastPosted ? '' : 'ml-auto'} w-8 h-8 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-rose-700 hover:bg-rose-50 transition-colors`}
                                        title={`Disconnect ${account.handle}`}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {connectOpen && (
                <Modal title="Connect a social account" onClose={() => setConnectOpen(false)}>
                    <div className="grid grid-cols-2 gap-2.5">
                        {PLATFORMS.map((p) => {
                            const isConnecting = connectingPlatform === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => onConnect(p.id)}
                                    disabled={!!connectingPlatform}
                                    className="inline-flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold border bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <p.icon size={16} />
                                    <span className="flex-1 text-left">{p.label}</span>
                                    {isConnecting && (
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">…</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </Modal>
            )}

            {disconnectTarget && (
                <Modal
                    title={`Disconnect ${disconnectTarget.handle}?`}
                    onClose={() => setDisconnectTarget(null)}
                >
                    <p className="text-sm text-gray-700 leading-relaxed mb-5">
                        Scheduled posts on this account will fail to publish until reconnected.
                    </p>
                    <div className="flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setDisconnectTarget(null)}
                            className="px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onConfirmDisconnect}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
                        >
                            <Trash2 size={12} />
                            Confirm
                        </button>
                    </div>
                </Modal>
            )}
        </SocialLayout>
    );
}
