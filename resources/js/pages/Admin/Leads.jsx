import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { 
    Search, Filter, Plus, MoreVertical, Eye, Edit2, 
    MessageSquare, Calendar, FileText, Award, Mail, Trash2,
    ChevronDown, Star, Clock, CheckSquare, FileSpreadsheet
} from 'lucide-react';

export default function Leads({ leads: backendLeads }) {
    // Initialize leads from backend
    const [leads, setLeads] = useState(() => {
        if (backendLeads && backendLeads.length > 0) {
            return backendLeads.map(lead => ({
                id: lead.lead_id || lead.id,
                name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown Lead',
                phone: lead.phone || '—',
                email: lead.email || '—',
                country: lead.country || lead.work_info?.city || '—',
                program: lead.study_plans?.[0]?.preferred_course || lead.stage || '—',
                source: lead.event ? `Event: ${lead.event.name}` : (lead.branch || 'Online Form'),
                status: lead.status || 'New',
                stage: lead.stage || 'N/A',
                branch: lead.branch || 'Main',
                assigned: 'System', // Since we don't have assigned_to yet
                createdAt: new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                priority: 'Medium',
                recentActivity: 'Recently'
            }));
        }
        return [];
    });

    const [selectedLeads, setSelectedLeads] = useState([]);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedLeads(leads.map(l => l.id));
        } else {
            setSelectedLeads([]);
        }
    };

    const toggleSelect = (id) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter(leadId => leadId !== id));
        } else {
            setSelectedLeads([...selectedLeads, id]);
        }
    };

    const getStatusStyle = (status) => {
        switch(status) {
            case 'New': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Contacted': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Qualified': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Processing': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'Closed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const getPriorityIcon = (priority) => {
        switch(priority) {
            case 'High': return <Star className="w-4 h-4 text-amber-500 fill-amber-500" />;
            case 'Medium': return <Star className="w-4 h-4 text-emerald-500 fill-emerald-500" />;
            case 'Low': return <Star className="w-4 h-4 text-gray-400" />;
            default: return null;
        }
    };

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
            <Head title="Leads Management" />

            {/* Page Header & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hidden lg:flex mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leads Pipeline</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage, filter, and track your incoming leads.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold shadow-sm">
                        <FileSpreadsheet size={16} className="text-emerald-600" />
                        Import Excel
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 text-sm font-semibold transition-colors shadow-sm">
                        <Filter size={16} />
                        Advanced Filters
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 text-sm font-semibold transition-colors shadow-sm">
                        <Plus size={16} />
                        Add New Lead
                    </button>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
                
                {/* Search */}
                <div className="w-full lg:w-96 relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input 
                        type="text" 
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all" 
                        placeholder="Search by Name, Email, Phone or ID..." 
                    />
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                        <option value="">Branch: All</option>
                        <option value="philippines">Philippines</option>
                        <option value="india">India</option>
                        <option value="malaysia">Malaysia</option>
                    </select>

                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                        <option value="">Stage: All</option>
                        <option value="sales">Sales / Follow Up</option>
                        <option value="goal_settings">Goal Settings</option>
                    </select>

                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer hidden xl:block">
                        <option value="">Status: All</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="processing">Processing</option>
                        <option value="closed">Closed</option>
                    </select>
                    
                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer hidden xl:block">
                        <option value="">Country: All</option>
                        <option value="canada">Canada</option>
                        <option value="australia">Australia</option>
                        <option value="uk">UK</option>
                    </select>

                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                        <option value="">Program: All</option>
                        <option value="student">Student Visa</option>
                        <option value="work">Work Visa</option>
                        <option value="tourist">Tourist Visa</option>
                    </select>

                    <div className="h-8 w-px bg-gray-200 mx-2 hidden lg:block"></div>

                    {/* Bulk Actions Context Menu (Visible if items selected) */}
                    {selectedLeads.length > 0 && (
                        <div className="flex items-center gap-2 animate-fade-in">
                            <span className="text-sm font-bold text-gray-700 mr-2 bg-blue-50 px-3 py-1 rounded-lg text-blue-700">
                                {selectedLeads.length} Selected
                            </span>
                            <button className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip" title="WhatsApp Message">
                                <MessageSquare size={18} />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="Send Email">
                                <Mail size={18} />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors tooltip" title="Change Status">
                                <CheckSquare size={18} />
                            </button>
                            <button className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip" title="Delete">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Leads Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto min-h-[500px]">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-10">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer" 
                                        onChange={toggleSelectAll}
                                        checked={selectedLeads.length === leads.length && leads.length > 0}
                                    />
                                </th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Lead Info</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Interest</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Source & Assignment</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-8">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {leads.map((lead) => (
                                <tr 
                                    key={lead.id} 
                                    className={`hover:bg-blue-50/30 transition-colors ${selectedLeads.includes(lead.id) ? 'bg-blue-50/50' : ''}`}
                                >
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                            checked={selectedLeads.includes(lead.id)}
                                            onChange={() => toggleSelect(lead.id)}
                                        />
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/leads/${lead.id}`} className="font-bold text-gray-900 text-sm hover:text-blue-600 transition-colors">{lead.name}</Link>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/admin/leads/${lead.id}`} className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded w-max hover:bg-gray-200 transition-colors">{lead.id}</Link>
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded w-max uppercase tracking-wider">{lead.branch}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm text-gray-900 font-medium">{lead.phone}</span>
                                            <span className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                                                <Mail size={10} />
                                                {lead.email}
                                            </span>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-gray-900">{lead.program}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-semibold text-gray-900">{lead.country}</span>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs font-medium text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full bg-white">{lead.source}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                                    {lead.assigned.charAt(0)}
                                                </div>
                                                <span className="text-xs text-gray-600 font-medium">{lead.assigned}</span>
                                            </div>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-start gap-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${lead.stage === 'Goal Settings' ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                                                    {lead.stage}
                                                </span>
                                            </div>
                                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(lead.status)}`}>
                                                {lead.status}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium flex items-center gap-1 mt-1">
                                                <Clock size={10} /> {lead.recentActivity}
                                            </span>
                                        </div>
                                    </td>
                                    
                                    <td className="px-6 py-4 text-right pr-6 relative">
                                        {/* Actions Dropdown Toggle */}
                                        <button 
                                            onClick={() => setActiveDropdown(activeDropdown === lead.id ? null : lead.id)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            Actions <ChevronDown size={14} className="text-gray-400" />
                                        </button>

                                        {/* Actions Dropdown Menu */}
                                        {activeDropdown === lead.id && (
                                            <>
                                                {/* Overlay to close dropdown */}
                                                <div className="fixed inset-0 z-40" onClick={() => setActiveDropdown(null)}></div>
                                                
                                                <div className="absolute right-6 top-16 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 divide-y divide-gray-50 animate-fade-in-up origin-top-right">
                                                    
                                                    {/* Group: View / Edit */}
                                                    <div className="px-1 py-1">
                                                        <Link href={`/admin/leads/${lead.id}`} className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <Eye size={16} className="text-gray-400" /> View Details
                                                        </Link>
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <Edit2 size={16} className="text-gray-400" /> Edit Lead
                                                        </button>
                                                    </div>

                                                    {/* Group: Communication */}
                                                    <div className="px-1 py-1">
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <MessageSquare size={16} className="text-green-500" /> WhatsApp Message
                                                        </button>
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <Mail size={16} className="text-blue-500" /> Send Email
                                                        </button>
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <Calendar size={16} className="text-purple-500" /> Schedule Meeting
                                                        </button>
                                                    </div>

                                                    {/* Group: Process */}
                                                    <div className="px-1 py-1">
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <CheckSquare size={16} className="text-indigo-500" /> Update Status
                                                        </button>
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <FileText size={16} className="text-orange-500" /> Add Notes
                                                        </button>
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors">
                                                            <Award size={16} className="text-amber-500" /> Generate Certificate
                                                        </button>
                                                    </div>

                                                    {/* Group: Danger */}
                                                    <div className="px-1 py-1">
                                                        <button className="flex w-full items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} /> Delete Lead
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination - Mocked */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">1</span> to <span className="font-semibold text-gray-900">{leads.length}</span> of <span className="font-semibold text-gray-900">{leads.length}</span> Leads
                        </div>
                        <div className="flex gap-1">
                            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50" disabled>Previous</button>
                            <button className="px-3 py-1.5 border border-gray-200 bg-gray-900 text-white rounded-lg text-sm font-medium shadow-sm">1</button>
                            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">2</button>
                            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">3</button>
                            <span className="px-2 py-1.5 text-gray-400">...</span>
                            <button className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Next</button>
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Tailwind Animation Utilities mapped to classes */}
            <style jsx>{`
                .animate-fade-in-up {
                    animation: fadeInUp 0.2s ease-out forwards;
                }
                .animate-fade-in {
                    animation: fadeIn 0.2s ease-out forwards;
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
