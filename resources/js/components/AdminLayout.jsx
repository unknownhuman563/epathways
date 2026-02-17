import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Menu, X, Home, Users, Settings, LogOut } from "lucide-react";

export default function AdminLayout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { url } = usePage();

    const navItems = [
        { name: "Dashboard", href: "/admin/dashboard", icon: <Home size={18} /> },
        { name: "Users", href: "/admin/users", icon: <Users size={18} /> },
        { name: "Settings", href: "/admin/settings", icon: <Settings size={18} /> },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:static lg:inset-0`}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
                    <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
                        <X className="w-6 h-6 text-gray-700" />
                    </button>
                </div>

                <nav className="mt-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-blue-600 transition-colors ${url.startsWith(item.href) ? "bg-gray-100 text-blue-600" : ""
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="absolute bottom-4 w-full px-6">
                    <button className="flex items-center gap-2 text-gray-700 hover:text-red-600 transition-colors">
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                {/* Top Navbar */}
                <header className="flex items-center justify-between bg-white shadow px-6 py-3">
                    <div className="flex items-center gap-3">
                        <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                            <Menu className="w-6 h-6 text-gray-700" />
                        </button>
                        <h1 className="text-lg font-semibold text-gray-800">
                            Admin Dashboard
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Admin User</span>
                        <img
                            src="https://via.placeholder.com/32"
                            alt="profile"
                            className="w-8 h-8 rounded-full"
                        />
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}
