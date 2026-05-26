import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Search, Plus, Edit2, Trash2, ChevronDown, Tag, Percent,
    Calendar as CalendarIcon, X, ChevronRight, ChevronLeft,
    AlertCircle, AlertTriangle, Eye, EyeOff,
} from 'lucide-react';

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
};

const promoState = (p) => {
    if (!p.is_active) return 'inactive';
    const today = todayISO();
    const from = String(p.date_from || '').slice(0, 10);
    const end = String(p.date_end || '').slice(0, 10);
    if (today < from) return 'scheduled';
    if (today > end) return 'expired';
    return 'live';
};

const stateStyle = {
    live:      'bg-emerald-100 text-emerald-700 border-emerald-200',
    scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
    expired:   'bg-gray-100 text-gray-500 border-gray-200',
    inactive:  'bg-amber-100 text-amber-700 border-amber-200',
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

function Select({ children, ...rest }) {
    return (
        <select
            {...rest}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
        >
            {children}
        </select>
    );
}

const blankPromo = () => ({
    program_id: '',
    title: '',
    description: '',
    percent: 10,
    date_from: todayISO(),
    date_end: '',
    is_active: true,
    promo_code: '',
    banner_image: null,
    cta_label: '',
    cta_link: '',
});

function PromoModal({ open, onClose, editing, programs }) {
    const isEdit = !!editing;

    const buildInitial = () => {
        if (!editing) return blankPromo();
        return {
            program_id:   editing.program_id ?? '',
            title:        editing.title ?? '',
            description:  editing.description ?? '',
            percent:      editing.percent ?? 0,
            date_from:    editing.date_from ? String(editing.date_from).slice(0, 10) : todayISO(),
            date_end:     editing.date_end ? String(editing.date_end).slice(0, 10) : '',
            is_active:    !!editing.is_active,
            promo_code:   editing.promo_code ?? '',
            banner_image: null,
            cta_label:    editing.cta_label ?? '',
            cta_link:     editing.cta_link ?? '',
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
        if (out.banner_image === null && isEdit) delete out.banner_image;
        out.is_active = d.is_active ? 1 : 0;
        return out;
    });

    const setField = (key, val) => setData(key, val);

    const submit = () => {
        const url = isEdit ? '/admin/promos/' + editing.id : '/admin/promos';
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
                        <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Promotion' : 'Create Promotion'}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Time-bound discount on a specific programme</p>
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
                            <Label required>Programme</Label>
                            <Select value={data.program_id} onChange={e => setField('program_id', e.target.value)}>
                                <option value="">— Select a programme —</option>
                                {programs.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.title}{p.level ? ` · L${p.level}` : ''}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <Label required>Title</Label>
                            <Input
                                value={data.title}
                                onChange={e => setField('title', e.target.value)}
                                placeholder="e.g. Early-bird intake special"
                            />
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Textarea
                                rows={3}
                                value={data.description}
                                onChange={e => setField('description', e.target.value)}
                                placeholder="What does this promo cover? Any conditions to mention?"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label required>Discount %</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={data.percent}
                                    onChange={e => setField('percent', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Promo code</Label>
                                <Input
                                    value={data.promo_code}
                                    onChange={e => setField('promo_code', e.target.value)}
                                    placeholder="e.g. EARLY25"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label required>From</Label>
                                <Input
                                    type="date"
                                    value={data.date_from}
                                    onChange={e => setField('date_from', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label required>Until</Label>
                                <Input
                                    type="date"
                                    value={data.date_end}
                                    onChange={e => setField('date_end', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>CTA button label</Label>
                                <Input
                                    value={data.cta_label}
                                    onChange={e => setField('cta_label', e.target.value)}
                                    placeholder="e.g. Claim offer"
                                />
                            </div>
                            <div>
                                <Label>CTA link (optional)</Label>
                                <Input
                                    type="url"
                                    value={data.cta_link}
                                    onChange={e => setField('cta_link', e.target.value)}
                                    placeholder="Defaults to the programme page"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Banner image</Label>
                            <div
                                className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                                onClick={() => document.getElementById('promo-image-input').click()}
                            >
                                {data.banner_image ? (
                                    <div className="relative">
                                        <img src={URL.createObjectURL(data.banner_image)} alt="preview" className="w-full h-32 object-cover rounded-lg" />
                                        <button type="button" onClick={e => { e.stopPropagation(); setField('banner_image', null); }} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : isEdit && editing?.banner_url ? (
                                    <div>
                                        <img src={editing.banner_url} alt="current" className="w-full h-32 object-cover rounded-lg" />
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
                                    id="promo-image-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => setField('banner_image', e.target.files[0] || null)}
                                />
                            </div>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none pt-2">
                            <input
                                type="checkbox"
                                checked={data.is_active}
                                onChange={e => setField('is_active', e.target.checked)}
                                className="w-4 h-4 rounded text-gray-900 focus:ring-gray-900"
                            />
                            <span className="text-sm text-gray-700">Active — show publicly while inside the date range</span>
                        </label>
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
                        {processing ? 'Saving…' : (isEdit ? 'Save Changes' : 'Create Promotion')}
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

export default function Promos({ promos = [], programs = [] }) {
    const [search, setSearch] = useState('');
    const [stateFilter, setStateFilter] = useState('All');
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (promo) => { setEditing(promo); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); };

    const enriched = promos.map(p => ({ ...p, _state: promoState(p) }));

    const filtered = enriched.filter(p => {
        const matchesSearch = !search ||
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.program?.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.promo_code?.toLowerCase().includes(search.toLowerCase());
        const matchesState = stateFilter === 'All' || p._state === stateFilter.toLowerCase();
        return matchesSearch && matchesState;
    });

    const totalItems = filtered.length;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
    const endIdx = pageSize === 'all' ? totalItems : Math.min(startIdx + pageSize, totalItems);
    const pageItems = pageSize === 'all' ? filtered : filtered.slice(startIdx, endIdx);

    useEffect(() => { setCurrentPage(1); }, [search, stateFilter, pageSize]);
    useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

    const counts = enriched.reduce((acc, p) => { acc[p._state] = (acc[p._state] || 0) + 1; return acc; }, {});

    const summaryCards = [
        { label: 'Total', value: promos.length, icon: <Tag className="w-5 h-5" />, dark: true, filterTo: 'All' },
        { label: 'Live now', value: counts.live || 0, icon: <Eye className="w-5 h-5" />, filterTo: 'Live' },
        { label: 'Scheduled', value: counts.scheduled || 0, icon: <CalendarIcon className="w-5 h-5" />, filterTo: 'Scheduled' },
        { label: 'Expired / Inactive', value: (counts.expired || 0) + (counts.inactive || 0), icon: <EyeOff className="w-5 h-5" />, filterTo: 'Expired' },
    ];

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete('/admin/promos/' + deleteTarget.id, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setDeleteTarget(null);
            },
        });
    };

    const cancelDelete = () => { if (!isDeleting) setDeleteTarget(null); };

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

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="Promotions" />

            <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Programme Promotions</h1>
                    <p className="text-sm text-gray-500 mt-1">Discount campaigns shown on the public Home, Education Journey and Programmes pages while live.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={16} />
                    Create Promotion
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, idx) => (
                    <div
                        key={idx}
                        onClick={() => setStateFilter(card.filterTo)}
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
                <div className="w-full lg:w-72 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                        placeholder="Search by title, programme, or code..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
                    {['All', 'Live', 'Scheduled', 'Expired', 'Inactive'].map(tab => (
                        <button key={tab} onClick={() => setStateFilter(tab)}
                            className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${stateFilter === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <button
                    onClick={openCreate}
                    className="lg:hidden flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={16} /> New Promotion
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Promo</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Programme</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                        <Tag className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold">No promotions found</p>
                                        <p className="text-sm mt-1">Create a promotion to get it on the public site.</p>
                                    </td>
                                </tr>
                            ) : pageItems.map(promo => (
                                <tr key={promo.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                {promo.banner_url ? (
                                                    <img src={promo.banner_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><Tag size={18} /></div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 text-sm max-w-[280px] truncate">{promo.title}</span>
                                                {promo.promo_code && (
                                                    <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded mt-0.5 inline-block w-fit">
                                                        {promo.promo_code}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        {promo.program?.title || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded">
                                            <Percent size={11} /> {Number(promo.percent || 0)}%
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <CalendarIcon size={11} className="text-gray-400" />
                                            {formatDate(promo.date_from)} → {formatDate(promo.date_end)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${stateStyle[promo._state]}`}>
                                            {promo._state}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right pr-6 relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === promo.id ? null : promo.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            Actions <ChevronDown size={14} className="text-gray-400" />
                                        </button>
                                        {activeDropdown === promo.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                                <div className="absolute right-6 top-14 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                                                    <button
                                                        onClick={() => { openEdit(promo); setActiveDropdown(null); }}
                                                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} className="text-gray-400" /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteTarget(promo); setActiveDropdown(null); }}
                                                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} /> Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
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
                                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                    <ChevronLeft size={14} /> Prev
                                </button>
                                {getPageNumbers().map((p, i) => (
                                    p === '…' ? (
                                        <span key={'el-' + i} className="px-2 text-gray-400 text-sm">…</span>
                                    ) : (
                                        <button key={p} onClick={() => setCurrentPage(p)}
                                            className={`min-w-[32px] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentPage === p ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'}`}>
                                            {p}
                                        </button>
                                    )
                                ))}
                                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                                    Next <ChevronRight size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PromoModal open={showModal} onClose={closeModal} editing={editing} programs={programs} />

            {deleteTarget && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={cancelDelete} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto" role="dialog" aria-modal="true">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">Delete promotion?</h3>
                                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                                        About to delete <span className="font-semibold text-gray-900">"{deleteTarget.title}"</span>. This also removes its banner image. Cannot be undone.
                                    </p>
                                </div>
                                <button onClick={cancelDelete} disabled={isDeleting} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={cancelDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                                <button onClick={confirmDelete} disabled={isDeleting} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                                    {isDeleting ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Deleting…
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={14} /> Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
