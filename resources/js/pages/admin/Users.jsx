import React, { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Search, Plus, Edit2, Trash2, ChevronDown, ChevronLeft, ChevronRight,
    Users as UsersIcon, ShieldCheck, Briefcase, X, AlertCircle, AlertTriangle, Mail,
} from 'lucide-react';

const ROLE_STYLES = {
    admin:         'bg-purple-100 text-purple-700 border-purple-200',
    sales:         'bg-blue-100 text-blue-700 border-blue-200',
    education:     'bg-emerald-100 text-emerald-700 border-emerald-200',
    english:       'bg-amber-100 text-amber-700 border-amber-200',
    immigration:   'bg-rose-100 text-rose-700 border-rose-200',
    accommodation: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

const roleStyle = (role) => ROLE_STYLES[role] || 'bg-gray-100 text-gray-600 border-gray-200';
const roleLabel = (role) => (role ? role.charAt(0).toUpperCase() + role.slice(1) : '—');

const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
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

const blankUser = () => ({ name: '', email: '', role: '', password: '' });

function UserModal({ open, onClose, editing, roles }) {
    const isEdit = !!editing;

    const buildInitial = () => {
        if (!editing) return { ...blankUser(), role: roles[0] || '' };
        return {
            name: editing.name ?? '',
            email: editing.email ?? '',
            role: editing.role ?? (roles[0] || ''),
            password: '',
        };
    };

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm(buildInitial());

    useEffect(() => {
        if (open) {
            setData(buildInitial());
            clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, editing?.id]);

    const setField = (key, val) => setData(key, val);

    const submit = () => {
        const url = isEdit ? '/admin/users/' + editing.id : '/admin/users';
        post(url, {
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
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white shadow-2xl animate-slide-in-right">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">{isEdit ? 'Edit User' : 'Add User'}</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Name, email, role and login password</p>
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
                            <Label required>Name</Label>
                            <Input value={data.name} onChange={e => setField('name', e.target.value)} placeholder="Jane Doe" />
                        </div>

                        <div>
                            <Label required>Email</Label>
                            <Input type="email" value={data.email} onChange={e => setField('email', e.target.value)} placeholder="jane@epathways.co.nz" />
                        </div>

                        <div>
                            <Label required>Role</Label>
                            <select
                                value={data.role}
                                onChange={e => setField('role', e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-all"
                            >
                                {roles.map(r => (
                                    <option key={r} value={r}>{roleLabel(r)}{r === 'admin' ? ' — full admin access' : ' portal'}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1.5">
                                Admins can open the whole admin area; a portal role only gets that department's portal.
                            </p>
                        </div>

                        <div>
                            <Label required={!isEdit}>Password</Label>
                            <Input
                                type="password"
                                value={data.password}
                                onChange={e => setField('password', e.target.value)}
                                placeholder={isEdit ? 'Leave blank to keep current' : 'At least 8 characters'}
                                autoComplete="new-password"
                            />
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
                        {processing ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add User')}
                    </button>
                </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .animate-slide-in-right { animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
            `}} />
        </>
    );
}

export default function Users({ users = [], roles = [] }) {
    const { props } = usePage();
    const currentUserId = props.auth?.user?.id;

    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All');
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const openCreate = () => { setEditing(null); setShowModal(true); };
    const openEdit = (user) => { setEditing(user); setShowModal(true); };
    const closeModal = () => { setShowModal(false); setEditing(null); };

    const filtered = users.filter(u => {
        const matchesSearch = !search ||
            u.name?.toLowerCase().includes(search.toLowerCase()) ||
            u.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'All' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const totalItems = filtered.length;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
    const startIdx = pageSize === 'all' ? 0 : (currentPage - 1) * pageSize;
    const endIdx = pageSize === 'all' ? totalItems : Math.min(startIdx + pageSize, totalItems);
    const pageItems = pageSize === 'all' ? filtered : filtered.slice(startIdx, endIdx);

    useEffect(() => { setCurrentPage(1); }, [search, roleFilter, pageSize]);
    useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

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

    const adminCount = users.filter(u => u.role === 'admin').length;
    const staffCount = users.length - adminCount;

    const summaryCards = [
        { label: 'Total Users', value: users.length, icon: <UsersIcon className="w-5 h-5" />, dark: true, filterTo: 'All' },
        { label: 'Admins', value: adminCount, icon: <ShieldCheck className="w-5 h-5" />, filterTo: 'admin' },
        { label: 'Portal Staff', value: staffCount, icon: <Briefcase className="w-5 h-5" />, filterTo: 'All' },
    ];

    const requestDelete = (user) => { setDeleteTarget(user); setActiveDropdown(null); };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        router.delete('/admin/users/' + deleteTarget.id, {
            preserveScroll: true,
            onFinish: () => { setIsDeleting(false); setDeleteTarget(null); },
        });
    };

    const cancelDelete = () => { if (!isDeleting) setDeleteTarget(null); };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="User Management" />

            <div className="hidden lg:flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Add staff accounts and control which admin area or department portal they can reach.</p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm"
                >
                    <Plus size={16} /> Add User
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {summaryCards.map((card, idx) => (
                    <div
                        key={idx}
                        onClick={() => setRoleFilter(card.filterTo)}
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
                        placeholder="Search by name or email..."
                    />
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                    {['All', ...roles].map(tab => (
                        <button key={tab} onClick={() => setRoleFilter(tab)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 ${roleFilter === tab ? 'bg-gray-900 text-white border-gray-900 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            {tab === 'All' ? 'All' : roleLabel(tab)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Added</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pageItems.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400">
                                        <UsersIcon className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                                        <p className="font-semibold">No users found</p>
                                        <p className="text-sm mt-1">Try adjusting your filters or add a new user.</p>
                                    </td>
                                </tr>
                            ) : pageItems.map(user => {
                                const isSelf = user.id === currentUserId;
                                return (
                                    <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {user.name?.charAt(0)?.toUpperCase() || '?'}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-sm">{user.name}</span>
                                                    {isSelf && <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">You</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            <div className="flex items-center gap-1.5">
                                                <Mail size={13} className="text-gray-400" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${roleStyle(user.role)}`}>
                                                {roleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(user.created_at)}</td>
                                        <td className="px-6 py-4 text-right pr-6 relative">
                                            <button
                                                onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                Actions <ChevronDown size={14} className="text-gray-400" />
                                            </button>
                                            {activeDropdown === user.id && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)} />
                                                    <div className="absolute right-6 top-14 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2">
                                                        <button
                                                            onClick={() => { openEdit(user); setActiveDropdown(null); }}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 size={16} className="text-gray-400" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => requestDelete(user)}
                                                            disabled={isSelf}
                                                            title={isSelf ? "You can't delete your own account" : undefined}
                                                            className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
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
                                                currentPage === p ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
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

            <UserModal open={showModal} onClose={closeModal} editing={editing} roles={roles} />

            {deleteTarget && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={cancelDelete} />
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto animate-fade-in-up" role="dialog" aria-modal="true">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900">Delete User?</h3>
                                    <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">
                                        You're about to permanently delete{' '}
                                        <span className="font-semibold text-gray-900">"{deleteTarget.name}"</span> ({deleteTarget.email}).
                                        They will lose access immediately. This action cannot be undone.
                                    </p>
                                </div>
                                <button onClick={cancelDelete} disabled={isDeleting} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50" aria-label="Close">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button onClick={cancelDelete} disabled={isDeleting} className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? (
                                        <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting…</>
                                    ) : (
                                        <><Trash2 size={14} /> Delete User</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <style dangerouslySetInnerHTML={{ __html: `
                        @keyframes fadeInUp { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
                        .animate-fade-in-up { animation: fadeInUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    `}} />
                </>
            )}
        </div>
    );
}
