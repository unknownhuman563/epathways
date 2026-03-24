import React from 'react';
import { Head } from '@inertiajs/react';
import { TrendingUp, TrendingDown, MoreHorizontal, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export default function Dashboard() {
    // Mock data based on the design
    const summaryCards = [
        { title: "Total Revenue", value: "$23,902", trend: "+4.2%", trendLabel: "from last month", isPositive: true, dark: true },
        { title: "Active Leads", value: "16,815", trend: "+1.7%", trendLabel: "from last month", isPositive: true, dark: false },
        { title: "New Forms", value: "1,457", trend: "-2.9%", trendLabel: "from last month", isPositive: false, dark: false },
        { title: "Total Bookings", value: "2,023", trend: "+0.9%", trendLabel: "from last month", isPositive: true, dark: false },
    ];

    const chartData = [
        { month: 'Jan', value: 50 },
        { month: 'Feb', value: 45 },
        { month: 'Mar', value: 75, highlight: true },
        { month: 'Apr', value: 35 },
        { month: 'May', value: 65 },
        { month: 'Jun', value: 25 },
    ];

    const recentBookings = [
        { id: 1, name: "Consultation Call", student: "Aria Smith", studentId: "#3456791", amount: "$372.00", status: "Paid" },
        { id: 2, name: "Visa Assessment", student: "John Doe", studentId: "#3456792", amount: "$150.00", status: "Pending" },
        { id: 3, name: "Document Review", student: "Jane Lane", studentId: "#3456793", amount: "$85.00", status: "Paid" },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <Head title="Admin Dashboard" />
            
            {/* Top Filters / Date Range */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 hidden lg:flex mb-6">
                <div className="flex-1"></div>
                <div className="flex items-center gap-3">
                    <div className="bg-white rounded-full p-1 border border-gray-100 flex shadow-sm">
                        <button className="px-4 py-1.5 text-sm font-medium rounded-full text-gray-500 hover:text-gray-900 transition-colors">Day</button>
                        <button className="px-4 py-1.5 text-sm font-medium rounded-full text-gray-500 hover:text-gray-900 transition-colors">Week</button>
                        <button className="px-4 py-1.5 text-sm font-bold bg-gray-900 text-white rounded-full shadow-sm">Month</button>
                        <button className="px-4 py-1.5 text-sm font-medium rounded-full text-gray-500 hover:text-gray-900 transition-colors">Year</button>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-full px-4 py-2 text-sm font-medium text-gray-700 shadow-sm flex items-center gap-2 cursor-pointer hover:bg-gray-50">
                        <CalendarIcon size={16} className="text-gray-400" />
                        1 Sep 2024 - 31 Sep 2024
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {summaryCards.map((card, idx) => (
                    <div key={idx} className={`p-6 rounded-3xl ${card.dark ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-900 shadow-sm border border-gray-50'} transition-transform hover:scale-[1.02] duration-300`}>
                        <h3 className={`text-sm font-medium mb-3 ${card.dark ? 'text-gray-300' : 'text-gray-500'}`}>{card.title}</h3>
                        <p className="text-3xl font-bold mb-4 tracking-tight">{card.value}</p>
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className={`flex items-center ${card.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {card.isPositive ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                                {card.trend}
                            </span>
                            <span className={card.dark ? 'text-gray-400 font-medium' : 'text-gray-400 font-medium'}>
                                {card.trendLabel}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Chart & Side widgets */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-lg font-bold text-gray-900">Total Leads Overview</h2>
                        <button className="bg-gray-50 hover:bg-gray-100 p-2 rounded-full text-gray-500 transition-colors">
                            <ArrowUpRight size={18} />
                        </button>
                    </div>
                    
                    <div className="h-64 flex items-end justify-between gap-2 sm:gap-4 px-2 relative">
                        {/* Fake Y Axis */}
                        <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-400 font-medium w-6 text-right">
                            <span>10K</span>
                            <span>8K</span>
                            <span>4K</span>
                            <span>2K</span>
                            <span>0</span>
                        </div>
                        
                        {/* Bars placeholder */}
                        <div className="flex items-end justify-between w-full h-full pb-8 pl-10">
                            {chartData.map((data, idx) => (
                                <div key={idx} className="flex flex-col items-center justify-end gap-3 relative group w-full h-full px-1 sm:px-3">
                                    <div 
                                        className={`w-full rounded-t-xl rounded-b-sm transition-all duration-300 relative overflow-hidden ${
                                            data.highlight 
                                                ? 'bg-gray-400 group-hover:bg-gray-500' 
                                                : 'bg-gray-900 group-hover:bg-gray-800'
                                        }`}
                                        style={{ height: `${data.value}%`, minHeight: '10%' }}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-500 absolute -bottom-6">{data.month}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Widgets */}
                <div className="flex flex-col gap-6">
                    {/* Calendar Mini */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                        <div className="flex items-center justify-between mb-6">
                            <button className="text-gray-400 hover:text-gray-700">
                                <ChevronLeft size={20} />
                            </button>
                            <h3 className="font-bold text-gray-900">September 2024</h3>
                            <button className="text-gray-400 hover:text-gray-700">
                                <ChevronRight size={20} />
                            </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="text-xs font-semibold text-gray-400 mb-2">Tue</div>
                            <div className="text-xs font-semibold text-gray-400 mb-2">Wed</div>
                            <div className="text-xs font-semibold text-gray-400 mb-2">Thu</div>
                            <div className="text-xs font-semibold text-gray-400 mb-2">Fri</div>
                            
                            <div className="text-sm font-bold text-gray-900 py-2">17</div>
                            <div className="text-sm font-bold text-gray-900 py-2">18</div>
                            <div className="text-sm font-bold text-white bg-gray-900 rounded-2xl py-2 shadow-md">19</div>
                            <div className="text-sm font-bold text-gray-900 py-2">20</div>
                        </div>
                    </div>

                    {/* Community Growth Mini */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50 flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">Community growth</h3>
                            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-500">
                                <ArrowUpRight size={14} />
                                0.9% <span className="text-gray-400 ml-1 font-medium">from last month</span>
                            </div>
                        </div>
                        <div className="relative w-14 h-14 flex items-center justify-center">
                            <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 36 36">
                                <path
                                    className="text-gray-100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                />
                                <path
                                    className="text-gray-900"
                                    strokeDasharray="65, 100"
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="absolute text-xs font-bold text-gray-900">65%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Table */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-50">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-gray-900">Recent Bookings</h2>
                    <div className="flex gap-2">
                        <button className="p-2 border border-gray-100 rounded-full text-gray-500 hover:bg-gray-50">
                            <Search size={16} />
                        </button>
                        <button className="p-2 border border-gray-100 rounded-full text-gray-500 hover:bg-gray-50">
                            <ArrowUpRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider pl-2">Service Name</th>
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Student Name</th>
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking ID</th>
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="pb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-2">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recentBookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="py-4 pl-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-7 bg-gray-200 rounded overflow-hidden">
                                                <img src={`https://picsum.photos/seed/${booking.id}/100/70`} alt="Thumbnail" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="font-semibold text-gray-900 text-sm">{booking.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-sm text-gray-600 font-medium">{booking.student}</td>
                                    <td className="py-4 text-sm text-gray-500 font-medium">{booking.studentId}</td>
                                    <td className="py-4 text-sm font-bold text-gray-900">{booking.amount}</td>
                                    <td className="py-4 text-right pr-2">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                                            booking.status === 'Paid' 
                                                ? 'bg-gray-900 text-white' 
                                                : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Simple Calendar Icon helper for the top filter row
function CalendarIcon({ size, className }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
        </svg>
    )
}
