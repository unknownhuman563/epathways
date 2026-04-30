import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Search, Plus, Edit2, Trash2, ChevronDown, GraduationCap,
    BookOpen, FileText, Archive, ArrowUpRight, X, ChevronRight, ChevronLeft,
    AlertCircle, AlertTriangle,
} from 'lucide-react';

const CATEGORY_LABELS = {
    diplomas: 'Diplomas',
    bachelors: 'Bachelors',
    masters: 'PG / Masters',
};

const DEFAULT_FEE_REGIONS = [
    'India & Subcontinent',
    'Southeast Asia',
    'China/Malaysia/Singapore',
    'LATAM/Europe/Africa/Middle East',
];

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

function Select({ children, ...props }) {
    return (
        <select
            {...props}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all text-gray-700"
        >
            {children}
        </select>
    );
}

function Textarea(props) {
    return (
        <textarea
            {...props}
            rows={props.rows || 3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all placeholder-gray-400 resize-none"
        />
    );
}

const blankProgram = () => ({
    title: '',
    institution: '',
    location: '',
    level: 5,
    category: 'diplomas',
    status: 'draft',
    price_text: '',
    image: null,
    description: '',
    intake_months: '',
    duration_months: '',
    credits: '',
    residency_points: '',
    hours_per_week: '',
    entry_requirements: '',
    english_requirements: '',
    employment_outcomes: '',
    post_study: '',
    fee_guide: DEFAULT_FEE_REGIONS.map(region => ({ region, fee: '' })),
    tuition_fee: '',
    tuition_fee_notes: '',
    insurance_fee: '',
    visa_processing_fee: '',
    living_expense: '',
    accommodation: '',
});

function getStatusStyle(status) {
    switch (status) {
        case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'archived': return 'bg-gray-100 text-gray-600 border-gray-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
}

function ProgramModal({ open, onClose, editing }) {
    const [step, setStep] = useState(1);
    const isEdit = !!editing;

    const initial = editing
        ? {
            ...blankProgram(),
            ...editing,
            image: null,
            fee_guide: editing.fee_guide && editing.fee_guide.length > 0
                ? editing.fee_guide
                : DEFAULT_FEE_REGIONS.map(region => ({ region, fee: '' })),
        }
        : blankProgram();

    const { data, setData, post, processing, errors, reset, clearErrors, transform } = useForm(initial);

    useEffect(() => {
        if (open) {
            setData(editing
                ? { ...blankProgram(), ...editing, image: null,
                    fee_guide: editing.fee_guide && editing.fee_guide.length > 0
                        ? editing.fee_guide
                        : DEFAULT_FEE_REGIONS.map(region => ({ region, fee: '' })) }
                : blankProgram());
            setStep(1);
            clearErrors();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing?.id]);

    transform((d) => {
        const out = { ...d };
        if (out.image === null && isEdit) delete out.image;
        out.fee_guide = (out.fee_guide || []).filter(r => r.region || r.fee);
        return out;
    });

    const setField = (key, val) => setData(key, val);

    const setFeeRow = (idx, key, val) => {
        const next = [...data.fee_guide];
        next[idx] = { ...next[idx], [key]: val };
        setData('fee_guide', next);
    };
    const addFeeRow = () => setData('fee_guide', [...data.fee_guide, { region: '', fee: '' }]);
    const removeFeeRow = (idx) => setData('fee_guide', data.fee_guide.filter((_, i) => i !== idx));

    const submit = () => {
        const url = isEdit ? '/admin/programs/' + editing.id : '/admin/programs';
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
                        <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit Program' : 'Create Program'}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Step {step} of 2 — {step === 1 ? 'Basics' : 'Details & Fees'}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-6 pt-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        {[1, 2].map(s => (
                            <React.Fragment key={s}>
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${step >= s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}>{s}</div>
                                {s < 2 && <div className={`flex-1 h-0.5 rounded-full ${step >= 2 ? 'bg-gray-900' : 'bg-gray-100'}`} />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {Object.keys(errors).length > 0 && (
                    <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle size={15} /> {Object.values(errors)[0]}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div>
                                <Label required>Title</Label>
                                <Input value={data.title} onChange={e => setField('title', e.target.value)} placeholder="e.g. NZ Diploma in Enrolled Nursing" />
                            </div>
                            {/*
                            <div>
                                <Label required>Institution</Label>
                                <Input value={data.institution} onChange={e => setField('institution', e.target.value)} placeholder="e.g. Wintec" />
                            </div>
                            */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label required>Level</Label>
                                    <Select value={data.level} onChange={e => setField('level', parseInt(e.target.value, 10))}>
                                        {[5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Level {n}</option>)}
                                    </Select>
                                </div>
                                <div>
                                    <Label required>Category</Label>
                                    <Select value={data.category} onChange={e => setField('category', e.target.value)}>
                                        <option value="diplomas">Diplomas</option>
                                        <option value="bachelors">Bachelors</option>
                                        <option value="masters">PG / Masters</option>
                                    </Select>
                                </div>
                                <div>
                                    <Label required>Status</Label>
                                    <Select value={data.status} onChange={e => setField('status', e.target.value)}>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </Select>
                                </div>
                            </div>
                            <div>
                                <Label>Location</Label>
                                <Input value={data.location} onChange={e => setField('location', e.target.value)} placeholder="e.g. Auckland" />
                            </div>
                            <div>
                                <Label>Banner Image</Label>
                                <div
                                    className="relative border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50"
                                    onClick={() => document.getElementById('program-image-input').click()}
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
                                        id="program-image-input"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => setField('image', e.target.files[0] || null)}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Program Overview</Label>
                                <Textarea rows={5} value={data.description} onChange={e => setField('description', e.target.value)} placeholder="About this program..." />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Intake Months</Label>
                                    <Input value={data.intake_months} onChange={e => setField('intake_months', e.target.value)} placeholder="February, July" />
                                </div>
                                <div>
                                    <Label>Duration (months)</Label>
                                    <Input type="number" min="0" value={data.duration_months} onChange={e => setField('duration_months', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label>Credits</Label>
                                    <Input type="number" min="0" value={data.credits} onChange={e => setField('credits', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Residency Pts</Label>
                                    <Input type="number" min="0" value={data.residency_points} onChange={e => setField('residency_points', e.target.value)} />
                                </div>
                                <div>
                                    <Label>Hours/Week</Label>
                                    <Input type="number" min="0" value={data.hours_per_week} onChange={e => setField('hours_per_week', e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <Label>Entry Requirements</Label>
                                <Textarea value={data.entry_requirements} onChange={e => setField('entry_requirements', e.target.value)} />
                            </div>
                            <div>
                                <Label>English Requirements</Label>
                                <Textarea value={data.english_requirements} onChange={e => setField('english_requirements', e.target.value)} placeholder="e.g. IELTS 6.0 overall, no band less than 5.5" />
                            </div>
                            <div>
                                <Label>Employment Outcomes</Label>
                                <Textarea value={data.employment_outcomes} onChange={e => setField('employment_outcomes', e.target.value)} />
                            </div>
                            <div>
                                <Label>Post Study</Label>
                                <Textarea value={data.post_study} onChange={e => setField('post_study', e.target.value)} />
                            </div>

                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                <Label>Tuition Fee</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <div>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.tuition_fee}
                                            onChange={e => setField('tuition_fee', e.target.value)}
                                            placeholder="1000.00"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Amount in NZD</p>
                                    </div>
                                    <div>
                                        <Input
                                            value={data.tuition_fee_notes}
                                            onChange={e => setField('tuition_fee_notes', e.target.value)}
                                            placeholder="e.g. Partial scholarship available"
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Notes (e.g. partial, sponsored, per semester)</p>
                                    </div>
                                </div>
                            </div>

                            {/*
                            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50">
                                <Label>Fee Guide (per region)</Label>
                                <div className="flex justify-between items-center mt-2 mb-1 px-1 pb-2 border-b border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Schools</span>
                                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mr-14">Fees</span>
                                </div>
                                <div className="space-y-1 mt-1">
                                    {data.fee_guide.map((row, idx) => (
                                        <div key={idx} className="flex gap-2 items-center py-1">
                                            <input
                                                value={row.region}
                                                onChange={e => setFeeRow(idx, 'region', e.target.value)}
                                                placeholder="Region name"
                                                className="flex-1 text-sm font-semibold text-gray-700 bg-transparent border-0 outline-none focus:bg-white focus:ring-1 focus:ring-gray-300 focus:rounded-md px-1 py-1.5 placeholder-gray-400"
                                            />
                                            <span className="text-gray-300">:</span>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={row.fee}
                                                onChange={e => setFeeRow(idx, 'fee', e.target.value)}
                                                placeholder="0.00"
                                                className="w-32"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeFeeRow(idx)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                                title="Remove region"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={addFeeRow}
                                    className="mt-3 w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-white flex items-center justify-center gap-2"
                                >
                                    <Plus size={14} /> Add Region
                                </button>
                            </div>
                            */}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Insurance Fee</Label>
                                    <Input type="number" step="0.01" min="0" value={data.insurance_fee} onChange={e => setField('insurance_fee', e.target.value)} placeholder="1000.00" />
                                    <p className="text-[10px] text-gray-400 mt-1">Amount in NZD</p>
                                </div>
                                <div>
                                    <Label>Visa Processing Fee</Label>
                                    <Input type="number" step="0.01" min="0" value={data.visa_processing_fee} onChange={e => setField('visa_processing_fee', e.target.value)} placeholder="2350.00" />
                                    <p className="text-[10px] text-gray-400 mt-1">Amount in NZD</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Living Expense (yearly)</Label>
                                    <Input type="number" step="0.01" min="0" value={data.living_expense} onChange={e => setField('living_expense', e.target.value)} placeholder="20000.00" />
                                    <p className="text-[10px] text-gray-400 mt-1">Amount in NZD per year</p>
                                </div>
                                <div>
                                    <Label>Accommodation</Label>
                                    <Input value={data.accommodation} onChange={e => setField('accommodation', e.target.value)} placeholder="from $180/week" />
                                    <p className="text-[10px] text-gray-400 mt-1">Free-text (include currency if relevant)</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between flex-shrink-0 bg-white">
                    {step === 1 ? (
                        <>
                            <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">Cancel</button>
                            <button
                                onClick={() => setStep(2)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 shadow-sm"
                            >
                                Next: Details <ChevronRight size={16} />
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900">
                                <ChevronLeft size={16} /> Back
                            </button>
                            <button
                                onClick={submit}
                                disabled={processing}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 shadow-sm disabled:opacity-60"
                            >
                                {processing ? (
                                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                                ) : (isEdit ? 'Update Program' : 'Create Program')}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0.8; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right { animation: slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </>
    );
}

export default function Programs({ programs = [] }) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (program) => { setEditing(program); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); };

    const filtered = programs.filter(p => {
        const matchesSearch = !search ||
            p.title?.toLowerCase().includes(search.toLowerCase()) ||
            p.institution?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'All' || p.status === statusFilter.toLowerCase();
        const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
        const matchesLevel = levelFilter === 'all' || String(p.level) === String(levelFilter);
        return matchesSearch && matchesStatus && matchesCategory && matchesLevel;
    });

    const totalItems = filtered.length;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
    const endIdx = pageSize === 'all' ? totalItems : Math.min(startIdx + pageSize, totalItems);
    const pageItems = pageSize === 'all' ? filtered : filtered.slice(startIdx, endIdx);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, categoryFilter, levelFilter, pageSize]);

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

    const summaryCards = [
        { label: 'Total Programs', value: programs.length, icon: <GraduationCap className="w-5 h-5" />, dark: true, filterTo: 'All' },
        { label: 'Published', value: programs.filter(p => p.status === 'published').length, icon: <BookOpen className="w-5 h-5" />, filterTo: 'Published' },
        { label: 'Drafts', value: programs.filter(p => p.status === 'draft').length, icon: <FileText className="w-5 h-5" />, filterTo: 'Draft' },
        { label: 'Archived', value: programs.filter(p => p.status === 'archived').length, icon: <Archive className="w-5 h-5" />, filterTo: 'Archived' },
    ];

    const handleDelete = (program) => {
        setDeleteTarget(program);
        setActiveDropdown(null);
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete('/admin/programs/' + deleteTarget.id, {
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
            <Head title="Programs Management" />

            <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Programs</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage the catalog of courses shown on the public site.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
                    >
                        <Plus size={16} />
                        Create Program
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                        placeholder="Search by title or institution..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:items-center">
                    {['All', 'Published', 'Draft', 'Archived'].map(tab => (
                        <button key={tab} onClick={() => setStatusFilter(tab)}
                            className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${statusFilter === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center lg:flex-nowrap">
                    <select
                        value={categoryFilter}
                        onChange={e => setCategoryFilter(e.target.value)}
                        className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-sm rounded-xl block py-2.5 pl-3 pr-8 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <option value="all">Category: All</option>
                        <option value="diplomas">Diplomas</option>
                        <option value="bachelors">Bachelors</option>
                        <option value="masters">PG / Masters</option>
                    </select>
                    <select
                        value={levelFilter}
                        onChange={e => setLevelFilter(e.target.value)}
                        className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 text-sm rounded-xl block py-2.5 pl-3 pr-8 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <option value="all">Level: All</option>
                        {[5, 6, 7, 8, 9].map(n => <option key={n} value={n}>Level {n}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Program</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                        <GraduationCap className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold">No programs found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or create a new program.</p>
                                    </td>
                                </tr>
                            ) : pageItems.map(program => (
                                <tr key={program.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                                                {program.image_url ? (
                                                    <img src={program.image_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300"><GraduationCap size={18} /></div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-900 text-sm max-w-[280px] truncate">{program.title}</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-xs text-gray-500">{program.institution}</span>
                                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">Level {program.level}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700 capitalize">{CATEGORY_LABELS[program.category] || program.category}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{program.location || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{program.price_text || '—'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border capitalize ${getStatusStyle(program.status)}`}>{program.status}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right pr-6 relative">
                                        <button
                                            onClick={() => setActiveDropdown(activeDropdown === program.id ? null : program.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            Actions <ChevronDown size={14} className="text-gray-400" />
                                        </button>
                                        {activeDropdown === program.id && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                                <div className="absolute right-6 top-14 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                                                    <button
                                                        onClick={() => { openEdit(program); setActiveDropdown(null); }}
                                                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                    >
                                                        <Edit2 size={16} className="text-gray-400" /> Edit
                                                    </button>
                                                    <a
                                                        href={'/program-details/' + program.id}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                    >
                                                        <ArrowUpRight size={16} className="text-gray-400" /> View Public
                                                    </a>
                                                    <button
                                                        onClick={() => handleDelete(program)}
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

            <ProgramModal open={showModal} onClose={closeModal} editing={editing} />

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
                                    <h3 className="text-lg font-bold text-gray-900">Delete Program?</h3>
                                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                                        You're about to permanently delete{' '}
                                        <span className="font-semibold text-gray-900">"{deleteTarget.title}"</span>.
                                        This will also remove its banner image from disk. This action cannot be undone.
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
                                            <Trash2 size={14} /> Delete Program
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
