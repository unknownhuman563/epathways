import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Search, Plus, Edit2, Trash2, ChevronDown, Video,
    Calendar as CalendarIcon, Clock, History,
    ArrowUpRight, X, ChevronRight, ChevronLeft,
    AlertCircle, AlertTriangle,
} from 'lucide-react';

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
};

const isUpcoming = (iso) => {
    if (!iso) return false;
    return String(iso).slice(0, 10) >= todayISO();
};

function Label({ children, required }) {
    return (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
            {children}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
    );
}

function Input(props) {
    return (
        <input
            {...props}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 ${props.className || ''}`}
        />
    );
}

function Textarea({ className, rows, ...rest }) {
    return (
        <textarea
            {...rest}
            rows={rows || 3}
            className={`w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 resize-y min-h-[80px] ${className || ''}`}
        />
    );
}

const blankSession = () => ({
    title: '',
    description: '',
    fb_link: '',
    image: null,
    session_date: '',
});

function getStatusStyle(upcoming) {
    return upcoming
        ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
        : 'bg-gray-100 text-gray-600 border-gray-200';
}

function SessionModal({ open, onClose, editing }) {
    const isEdit = !!editing;

    const buildInitial = () => {
        if (!editing) return blankSession();
        return {
            title: editing.title ?? '',
            description: editing.description ?? '',
            fb_link: editing.fb_link ?? '',
            image: null,
            session_date: editing.session_date ? String(editing.session_date).slice(0, 10) : '',
        };
    };

    const { data, setData, post, processing, errors, reset, clearErrors, transform } = useForm(buildInitial());

    useEffect(() => {
        if (open) {
            setData(buildInitial());
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing?.id]);

    transform((d) => {
        const out = { ...d };
        if (out.image === null && isEdit) delete out.image;
        return out;
    });

    const setField = (key, val) => setData(key, val);

    const submit = () => {
        const url = isEdit ? '/admin/facebook-live/' + editing.id : '/admin/facebook-live';
        post(url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    };

    if (!open) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={onClose} />
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col bg-white shadow-2xl animate-slide-in-right">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Session' : 'Create Session'}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Facebook Live session details</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={15} /> {Object.values(errors)[0]}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    <div className="space-y-4">
                        <div>
                            <Label required>Title</Label>
                            <Input
                                value={data.title}
                                onChange={e => setField('title', e.target.value)}
                                placeholder="e.g. Visa interview tips"
                            />
                        </div>

                        <div>
                            <Label required>Description</Label>
                            <Textarea
                                rows={4}
                                value={data.description}
                                onChange={e => setField('description', e.target.value)}
                                placeholder="What this session is about..."
                            />
                        </div>

                        <div>
                            <Label required>Facebook Link</Label>
                            <Input
                                type="url"
                                value={data.fb_link}
                                onChange={e => setField('fb_link', e.target.value)}
                                placeholder="https://www.facebook.com/share/v/..."
                            />
                        </div>

                        <div>
                            <Label required>Session Date</Label>
                            <Input
                                type="date"
                                value={data.session_date}
                                onChange={e => setField('session_date', e.target.value)}
                            />
                        </div>

                        <div>
                            <Label>Banner Image</Label>
                            <div
                                className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                                onClick={() => document.getElementById('fb-live-image-input').click()}
                            >
                                {data.image ? (
                                    <div className="relative">
                                        <img src={URL.createObjectURL(data.image)} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                                        <button type="button" onClick={e => { e.stopPropagation(); setField('image', null); }} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : isEdit && editing?.image_url ? (
                                    <div>
                                        <img src={editing.image_url} alt="current" className="w-full h-32 object-cover rounded-lg" />
                                        <p className="text-[10px] text-gray-400 mt-2">Current image — click to replace</p>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <div className="text-3xl mb-2">🖼️</div>
                                        <p className="text-xs font-semibold text-gray-500">Click to upload banner</p>
                                        <p className="text-[10px] text-gray-400 mt-1">PNG, JPG, WEBP up to 4MB</p>
                                    </div>
                                )}
                                <input
                                    id="fb-live-image-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => setField('image', e.target.files[0] || null)}
                                />
                            </div>
                        </div>

                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 flex-shrink-0">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={processing}
                        className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {processing ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Session')}
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                .animate-slide-in-right { animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </>
    );
}

export default function FacebookLive({ sessions = [] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (session) => { setEditing(session); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); };

    const filtered = sessions.filter(s => {
        const matchesSearch = !search ||
            s.title?.toLowerCase().includes(search.toLowerCase()) ||
            s.description?.toLowerCase().includes(search.toLowerCase());
        const upcoming = isUpcoming(s.session_date);
        const matchesStatus =
            statusFilter === 'All' ||
            (statusFilter === 'Upcoming' && upcoming) ||
            (statusFilter === 'Past' && !upcoming);
        return matchesSearch && matchesStatus;
    });

    const totalItems = filtered.length;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
    const endIdx = pageSize === 'all' ? totalItems : Math.min(startIdx + pageSize, totalItems);
    const pageItems = pageSize === 'all' ? filtered : filtered.slice(startIdx, endIdx);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, pageSize]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const getPageNumbers = () => {
        const delta = 1;
        const pages = [];
        const left = Math.max(2, currentPage - delta);
        const right = Math.min(totalPages - 1, currentPage + delta);
        pages.push(1);
        if (left > 2) pages.push('…');
        for (let i = left; i <= right; i++) pages.push(i);
        if (right < totalPages - 1) pages.push('…');
        if (totalPages > 1) pages.push(totalPages);
        return pages;
    };

    const upcomingCount = sessions.filter(s => isUpcoming(s.session_date)).length;
    const pastCount = sessions.length - upcomingCount;

    const summaryCards = [
        { label: 'Total Sessions', value: sessions.length, icon: <Video className="w-5 h-5" />, dark: true, filterTo: 'All' },
        { label: 'Upcoming', value: upcomingCount, icon: <Clock className="w-5 h-5" />, filterTo: 'Upcoming' },
        { label: 'Past', value: pastCount, icon: <History className="w-5 h-5" />, filterTo: 'Past' },
    ];

    const handleDelete = (session) => {
        setDeleteTarget(session);
        setActiveDropdown(null);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete('/admin/facebook-live/' + deleteTarget.id, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const cancelDelete = () => {
        if (isDeleting) return;
        setDeleteTarget(null);
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="Facebook Live Management" />

            <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Facebook Live</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage past and upcoming live sessions shown on the Activities page.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Create Session
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaryCards.map((card, idx) => (
                    <div
                        key={idx}
                        onClick={() => setStatusFilter(card.filterTo)}
                        className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.02] ${card.dark ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-900 shadow-sm border border-gray-100'}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className={`text-sm font-medium ${card.dark ? 'text-gray-300' : 'text-gray-500'}`}>{card.label}</span>
                            <span className={`p-1.5 rounded-lg ${card.dark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'}`}>{card.icon}</span>
                        </div>
                        <p className="text-3xl font-bold tracking-tight">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
                <div className="w-full lg:w-72 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="Search by title or description..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
                    {['All', 'Upcoming', 'Past'].map(tab => (
                        <button key={tab} onClick={() => setStatusFilter(tab)}
                            className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${statusFilter === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Session</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Facebook</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                        <Video className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold">No sessions found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or create a new session.</p>
                                    </td>
                                </tr>
                            ) : pageItems.map(session => {
                                const upcoming = isUpcoming(session.session_date);
                                return (
                                    <tr key={session.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {session.image_url ? (
                                                        <img src={session.image_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-300"><Video size={18} /></div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-900 text-sm max-w-[280px] truncate">{session.title}</span>
                                                    <span className="text-xs text-gray-500 max-w-[280px] truncate">{session.description}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-1.5">
                                                <CalendarIcon size={13} className="text-gray-400" />
                                                {formatDate(session.session_date)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(upcoming)}`}>
                                                {upcoming ? 'Upcoming' : 'Past'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <a
                                                href={session.fb_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline truncate inline-block max-w-[220px]"
                                            >
                                                {session.fb_link}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-right pr-6 relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === session.id ? null : session.id)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                Actions <ChevronDown size={14} className="text-gray-400" />
                                            </button>
                                            {activeDropdown === session.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                                    <div className="absolute right-6 top-14 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                                                        <button
                                                            onClick={() => { openEdit(session); setActiveDropdown(null); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={16} className="text-gray-400" /> Edit
                                                        </button>
                                                        <a
                                                            href={session.fb_link}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            <ArrowUpRight size={16} className="text-gray-400" /> Watch on Facebook
                                                        </a>
                                                        <button
                                                            onClick={() => handleDelete(session)}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 size={16} /> Delete
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalItems > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Show</span>
                            <select
                                value={pageSize}
                                onChange={e => setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                                className="bg-white border border-gray-200 text-gray-700 text-sm rounded-lg py-1 pl-2 pr-7 outline-none hover:bg-gray-50 cursor-pointer"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value="all">All</option>
                            </select>
                            <span>per page</span>
                        </div>

                        <div className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{startIdx + 1}</span> to <span className="font-semibold text-gray-900">{endIdx}</span> of <span className="font-semibold text-gray-900">{totalItems}</span>
                        </div>

                        {pageSize !== 'all' && totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                {getPageNumbers().map((p, i) => (
                                    p === '…' ? (
                                        <span key={'ellipsis-' + i} className="px-2 text-gray-400 text-sm">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => setCurrentPage(p)}
                                            className={`min-w-[32px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                                currentPage === p
                                                    ? 'bg-gray-900 text-white shadow-sm'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SessionModal open={showModal} onClose={closeModal} editing={editing} />

            {deleteTarget && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                        onClick={cancelDelete}
                    />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto animate-fade-in-up"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">Delete Session?</h3>
                                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                                        You're about to permanently delete{' '}
                                        <span className="font-semibold text-gray-900">"{deleteTarget.title}"</span>.
                                        This will also remove its image from disk. This action cannot be undone.
                                    </p>
                                </div>
                                <button
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                    aria-label="Close"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={cancelDelete}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Deleting…
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} /> Delete Session
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes fadeInUp {
                            from { opacity: 0; transform: translateY(8px) scale(0.98); }
                            to { opacity: 1; transform: translateY(0) scale(1); }
                        }
                        .animate-fade-in-up { animation: fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    `}} />
                </>
            )}
        </div>
    );
}
