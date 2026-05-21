import { useState } from 'react';
import { useForm, Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    Mail, Lock, ArrowRight, Eye, EyeOff, Loader, Shield,
} from 'react-feather';
import Logo from '@assets/newlogosite.png';
import AucklandImg from '@assets/NewSections/nz_city.png';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen bg-white font-urbanist">
            <Head title="Log in — ePathways" />

            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">

                {/* ═══════ LEFT — Auckland hero (hidden on mobile) ═══════ */}
                <aside className="hidden lg:block relative overflow-hidden">
                    {/* Image */}
                    <img
                        src={AucklandImg}
                        alt="Auckland skyline at dusk"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    {/* Dark wash for legible overlay text */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#282728]/30 via-[#282728]/20 to-[#282728]/85"></div>

                    {/* Top-left logo */}
                    <div className="absolute top-8 left-8 z-10">
                        <Link href="/" className="inline-flex items-center gap-3 group">
                            <div className="w-11 h-11 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-lg">
                                <img src={Logo} alt="ePathways" className="w-7 h-7 object-contain" />
                            </div>
                            <span className="text-white font-medium text-lg tracking-tight group-hover:opacity-90 transition-opacity">
                                ePathways
                            </span>
                        </Link>
                    </div>

                    {/* Bottom-left overlay text */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute bottom-12 left-12 right-12 z-10 max-w-md"
                    >
                        <h2 className="text-white text-[42px] xl:text-5xl font-medium tracking-tight leading-[1.05] mb-3">
                            Your New Zealand,<br />
                            <span className="font-light italic text-[#a8c89a]">organised.</span>
                        </h2>
                        <p className="text-white/75 text-sm xl:text-base font-light leading-relaxed max-w-sm">
                            Sign in to track your documents, consultations and visa progress — all in one place.
                        </p>

                        {/* Pagination dots (decorative — matches the reference) */}
                        <div className="flex items-center gap-2 mt-8">
                            <span className="block w-8 h-1 rounded-full bg-white"></span>
                            <span className="block w-1.5 h-1.5 rounded-full bg-white/40"></span>
                            <span className="block w-1.5 h-1.5 rounded-full bg-white/40"></span>
                        </div>
                    </motion.div>
                </aside>

                {/* ═══════ RIGHT — form panel ═══════ */}
                <main className="relative flex items-center justify-center px-6 sm:px-10 lg:px-12 py-10 sm:py-14">
                    {/* Mobile-only header bar with logo + back link */}
                    <div className="lg:hidden absolute top-6 left-6 right-6 flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <img src={Logo} alt="ePathways" className="h-9 w-auto" />
                        </Link>
                        <Link
                            href="/"
                            className="text-[10px] font-bold text-[#282728]/60 uppercase tracking-[0.22em] hover:text-[#282728]"
                        >
                            Back home
                        </Link>
                    </div>

                    {/* Desktop top-right "Back home" pill (echoes the reference's pill button) */}
                    <Link
                        href="/"
                        className="hidden lg:inline-flex items-center gap-2 absolute top-8 right-8 px-5 py-2.5 rounded-full bg-[#282728] text-white text-xs font-medium hover:bg-black transition-colors"
                    >
                        Back to site
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className="w-full max-w-[420px] mt-20 lg:mt-0"
                    >
                        {/* Heading */}
                        <div className="mb-9">
                            <h1 className="text-[34px] sm:text-[40px] font-medium text-[#282728] tracking-tight leading-[1.05] mb-2">
                                Welcome back to <span className="italic font-light text-[#436235]">ePathways!</span>
                            </h1>
                            <p className="text-sm text-[#282728]/55 font-light">
                                Sign in to your account
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-[12px] font-medium text-[#282728]/70 mb-2">
                                    Your Email
                                </label>
                                <div className="relative">
                                    <Mail
                                        size={15}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                                    />
                                    <input
                                        id="email"
                                        type="text"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        autoComplete="username"
                                        placeholder="you@example.com or username"
                                        className="font-urbanist w-full pl-11 pr-4 py-3.5 rounded-xl text-[14px] bg-white border border-[#282728]/20 text-[#282728] outline-none focus:border-[#282728] hover:border-[#282728]/35 transition-colors placeholder:text-gray-300 placeholder:font-light"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-red-500 font-light mt-1.5 pl-1">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-[12px] font-medium text-[#282728]/70 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock
                                        size={15}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"
                                    />
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        autoComplete="current-password"
                                        placeholder="••••••••••••"
                                        className="font-urbanist w-full pl-11 pr-12 py-3.5 rounded-xl text-[14px] bg-white border border-[#282728]/20 text-[#282728] outline-none focus:border-[#282728] hover:border-[#282728]/35 transition-colors placeholder:text-gray-300 placeholder:font-light tracking-wider"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-gray-400 hover:text-[#282728] hover:bg-[#f7f8f6] flex items-center justify-center transition-colors"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-red-500 font-light mt-1.5 pl-1">{errors.password}</p>
                                )}
                            </div>

                            {/* Remember me + Forgot */}
                            <div className="flex items-center justify-between pt-1">
                                <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="peer sr-only"
                                    />
                                    <span className="w-[18px] h-[18px] rounded-md border border-[#282728]/25 bg-white peer-checked:bg-[#282728] peer-checked:border-[#282728] peer-focus-visible:ring-2 peer-focus-visible:ring-[#282728]/20 flex items-center justify-center transition-all">
                                        <svg
                                            viewBox="0 0 16 16"
                                            className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        >
                                            <polyline points="3,8 7,12 13,4" />
                                        </svg>
                                    </span>
                                    <span className="text-[13px] text-[#282728]/70 font-light">Remember me</span>
                                </label>
                                <a
                                    href="mailto:info@epathways.co.nz?subject=Portal%20password%20help"
                                    className="text-[12px] text-[#282728]/55 font-medium hover:text-[#282728] transition-colors"
                                >
                                    Forgot Password?
                                </a>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="font-urbanist w-full mt-3 inline-flex items-center justify-center gap-3 bg-[#282728] text-white py-4 rounded-xl text-sm font-medium hover:bg-black active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-[#282728]/20 focus-visible:outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <>
                                        <Loader size={15} className="animate-spin" />
                                        Signing in
                                    </>
                                ) : (
                                    <>
                                        Login
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Secondary register link */}
                        <p className="text-center text-[13px] text-[#282728]/60 font-light mt-7">
                            Don&apos;t have an account?{' '}
                            <a
                                href="/free-assessment"
                                className="text-[#436235] font-medium hover:underline underline-offset-4 decoration-1"
                            >
                                Start free assessment
                            </a>
                        </p>

                        {/* Bottom security note */}
                        <div className="mt-10 pt-6 border-t border-[#282728]/10 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#282728]/35">
                            <Shield size={11} strokeWidth={2.5} />
                            Secure portal access
                        </div>
                    </motion.div>
                </main>

            </div>
        </div>
    );
}
