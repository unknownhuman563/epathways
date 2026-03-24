import { Link, usePage, router } from "@inertiajs/react";
import { useState } from "react";
import { 
    Menu, X, Search, Bell, Settings, HelpCircle, LogOut,
    Home, Users, Calendar as CalendarIcon, BookOpen, ChevronDown
} from "lucide-react";

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url, props } = usePage();
    const user = props.auth?.user;

    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: <Home size={20} /> },
        { name: "Leads", href: "/admin/leads", icon: <Users size={20} /> },
        { name: "Events", href: "/admin/events", icon: <CalendarIcon size={20} /> },
        { name: "Bookings", href: "/admin/booking", icon: <BookOpen size={20} /> },
    ];

    const handleLogout = () => {
        router.post(route('logout'));
    };

    const SidebarContent = () => (
        <>
            <div className="flex items-center justify-between px-6 py-6 border-b border-gray-50/50 lg:border-none">
                <h2 className="text-2xl font-black tracking-tighter text-gray-900">ePathways.</h2>
                <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                    <X className="w-5 h-5 text-gray-500 hover:text-gray-800" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-1 scrollbar-hide">
                {navItems.map((item) => {
                    const isActive = url.startsWith(item.href);
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                                isActive 
                                    ? "bg-gray-100/80 text-gray-900 shadow-sm" 
                                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                            }`}
                        >
                            <div className={`${isActive ? "text-gray-900" : "text-gray-400 group-hover:text-gray-600"}`}>
                                {item.icon}
                            </div>
                            {item.name}
                        </Link>
                    );
                })}

                <div className="mt-8 mb-4">
                    <div className="bg-gray-900 rounded-2xl p-5 text-center relative overflow-hidden group shadow-lg">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500"></div>
                        <h3 className="text-white font-bold text-sm mb-1 relative z-10">Upgrade To Pro</h3>
                        <p className="text-gray-400 text-xs mb-4 leading-relaxed relative z-10">Get access to additional features and content</p>
                        <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-semibold py-2 px-4 rounded-lg w-full transition-colors relative z-10 backdrop-blur-sm shadow-sm ring-1 ring-white/10">
                            Upgrade
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-4 py-4 mt-auto border-t border-gray-50 flex flex-col gap-1">
                <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                    <Settings size={20} className="text-gray-400" />
                    Settings
                </Link>
                <Link href="/admin/help" className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors">
                    <HelpCircle size={20} className="text-gray-400" />
                    Help Center
                </Link>
                <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left group"
                >
                    <LogOut size={20} className="text-gray-400 group-hover:text-red-600" />
                    Log out
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen bg-[#F5F5F7] font-sans selection:bg-gray-800 selection:text-white overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out lg:hidden shadow-2xl
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 bg-[#F5F5F7] h-screen shrink-0 pb-4 pt-4 pl-4">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-50 flex-1 flex flex-col overflow-hidden">
                    <SidebarContent />
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Top Navbar */}
                <header className="flex items-center justify-between px-8 py-3 bg-[#F5F5F7] lg:bg-transparent">
                    <div className="flex items-center gap-4">
                        <button className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-200 rounded-xl" onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900 hidden lg:block tracking-tight">
                            Dashboard
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-4 lg:gap-5 mt-2">
                        <div className="hidden md:flex items-center bg-white border border-gray-100 rounded-full px-4 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-200 transition-shadow">
                            <Search size={16} className="text-gray-400" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="bg-transparent border-none outline-none text-sm text-gray-700 ml-2 w-48 placeholder-gray-400"
                            />
                        </div>

                        <button className="relative p-1.5 text-gray-500 hover:bg-white hover:shadow-sm rounded-full transition-all">
                            <Bell size={18} />
                            <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#F5F5F7]"></span>
                        </button>

                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm shadow-md overflow-hidden ring-2 ring-white cursor-pointer hover:ring-gray-200 transition-all">
                            {user?.name?.charAt(0) || 'A'}
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 pt-2">
                    <h1 className="text-2xl font-bold text-gray-900 lg:hidden mb-6 tracking-tight">
                        Dashboard
                    </h1>
                    {children}
                </main>
            </div>
        </div>
    );
}
