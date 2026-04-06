import React from 'react';
import { useForm, Head } from '@inertiajs/react';
import Logo from "@assets/newlogosite.png";

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white px-4 font-urbanist relative overflow-hidden">
            <Head title="Login" />
            
            {/* Background Decorations - Very Subtle */}
            <div className="absolute top-0 right-0 w-1/3 h-screen bg-[#282728]/[0.02] -skew-x-12 transform origin-top translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-1/4 h-64 bg-[#282728]/[0.01] rounded-full blur-3xl" />

            <div className="max-w-[440px] w-full relative z-10">
                <div className="mb-12 text-center">
                    <a href="/" className="inline-block mb-10 hover:scale-105 transition-transform duration-300">
                        <img src={Logo} alt="ePathways" className="h-16 w-auto mx-auto" />
                    </a>
                    <h2 className="text-[11px] font-black text-[#436235] uppercase tracking-[0.4em] mb-3">
                        Nexus Administration
                    </h2>
                    <h1 className="text-3xl font-black text-[#282728] uppercase tracking-tighter">
                        Log in to Dashboard
                    </h1>
                </div>

                <div className="bg-white p-10 lg:p-12 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(40,39,40,0.1)] border border-[#282728]/5">
                    <form onSubmit={submit} className="space-y-7">
                        <div>
                            <label className="text-[10px] font-black text-[#282728] uppercase tracking-[0.2em] mb-2.5 block ml-1">
                                Email Address
                            </label>
                            <input
                                type="text"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl text-sm font-bold text-[#282728] outline-none focus:ring-4 focus:ring-[#282728]/5 transition-all placeholder:text-gray-300"
                                placeholder="name@e-pathways.co.nz"
                            />
                            {errors.email && (
                                <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2.5 ml-1">
                                <label className="text-[10px] font-black text-[#282728] uppercase tracking-[0.2em] block">
                                    Secret Password
                                </label>
                                <a href="#" className="text-[9px] font-bold text-gray-400 uppercase tracking-widest hover:text-[#282728] transition-colors">
                                    Forgot?
                                </a>
                            </div>
                            <input
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                className="w-full px-5 py-4 bg-white border border-[#282728] rounded-2xl text-sm font-bold text-[#282728] outline-none focus:ring-4 focus:ring-[#282728]/5 transition-all placeholder:text-gray-300"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <p className="mt-2 text-[10px] font-bold text-red-500 uppercase tracking-widest ml-1">{errors.password}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 ml-1">
                            <label className="relative flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="peer sr-only"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <div className="w-5 h-5 bg-white border border-[#282728] rounded-md peer-checked:bg-[#282728] transition-all flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="ml-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Keep me logged in</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className={`w-full bg-[#282728] text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-[#282728]/20 hover:bg-black transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2`}
                        >
                            {processing ? 'Authorizing...' : 'Enter Dashboard'}
                        </button>
                    </form>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                        &copy; {new Date().getFullYear()} ePathways Education Specialists
                    </p>
                </div>
            </div>
        </div>
    );
}
