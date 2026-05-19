import { useState } from "react";
import { Head, useForm } from "@inertiajs/react";
import { Lock, Eye, EyeOff, ArrowRight, Loader } from "react-feather";
import Logo from "@assets/newlogosite.png";

export default function SetupAccount({ token, lead }) {
    const { data, setData, post, processing, errors } = useForm({
        password: "",
        password_confirmation: "",
    });
    const [showPassword, setShowPassword] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post(`/lead-portal/setup/${token}`);
    };

    return (
        <div className="min-h-screen bg-[#f7f8f6] font-urbanist flex items-center justify-center px-6 py-12">
            <Head title="Activate your ePathways portal" />

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <img src={Logo} alt="ePathways" className="h-9 mx-auto mb-6" />
                    <p className="text-[10px] font-bold text-[#436235] uppercase tracking-[0.3em]">
                        Portal access
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl border border-[#282728]/15 p-8 sm:p-10 shadow-[0_30px_60px_-30px_rgba(40,39,40,0.18)]">
                    <h1 className="text-2xl sm:text-3xl font-medium text-[#282728] tracking-tight leading-tight mb-2">
                        Welcome, {lead.first_name}.
                    </h1>
                    <p className="text-sm text-gray-500 font-light leading-relaxed mb-7">
                        Set a password to activate your secure portal. You&apos;ll use this email and password to sign in.
                    </p>

                    <form onSubmit={submit} className="space-y-5">
                        {/* Email (locked) */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={lead.email}
                                readOnly
                                className="w-full px-4 py-3.5 rounded-xl text-sm bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-2">
                                Choose a password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={data.password}
                                    onChange={(e) => setData("password", e.target.value)}
                                    placeholder="At least 8 characters"
                                    autoComplete="new-password"
                                    autoFocus
                                    className="w-full px-4 py-3.5 pr-12 rounded-xl text-sm bg-white border border-gray-200 text-[#282728] outline-none focus:border-[#436235] transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1.5 font-light">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm */}
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-400 mb-2">
                                Confirm password
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                value={data.password_confirmation}
                                onChange={(e) => setData("password_confirmation", e.target.value)}
                                placeholder="Re-enter password"
                                autoComplete="new-password"
                                className="w-full px-4 py-3.5 rounded-xl text-sm bg-white border border-gray-200 text-[#282728] outline-none focus:border-[#436235] transition-colors"
                            />
                            {errors.token && (
                                <p className="text-xs text-red-500 mt-1.5 font-light">{errors.token}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 inline-flex items-center justify-center gap-3 bg-[#436235] text-white text-[11px] font-bold px-7 py-4 rounded-xl hover:bg-[#385029] active:scale-[0.99] transition-all uppercase tracking-[0.22em] disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Activating
                                </>
                            ) : (
                                <>
                                    <Lock size={13} strokeWidth={2.5} />
                                    Activate portal
                                    <ArrowRight size={13} strokeWidth={2.5} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] text-gray-400 font-light mt-6">
                    Need help? Email <a href="mailto:info@epathways.co.nz" className="underline">info@epathways.co.nz</a>
                </p>
            </div>
        </div>
    );
}
