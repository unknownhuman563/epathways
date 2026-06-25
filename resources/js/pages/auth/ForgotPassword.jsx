import { useForm, Head, Link, usePage } from "@inertiajs/react";
import { Mail, ArrowRight, Loader, ArrowLeft } from "react-feather";
import Logo from "@assets/newlogosite.png";

export default function ForgotPassword() {
    const { data, setData, post, processing, errors } = useForm({ email: "" });
    const flash = usePage().props.flash || {};

    const submit = (e) => {
        e.preventDefault();
        post("/forgot-password");
    };

    return (
        <div className="min-h-screen bg-white font-urbanist flex items-center justify-center px-6 py-12">
            <Head title="Account Recovery — ePathways" />

            <div className="w-full max-w-[420px]">
                <Link href="/" className="inline-flex items-center gap-2 mb-10">
                    <img src={Logo} alt="ePathways" className="h-10 w-auto" />
                </Link>

                <h1 className="text-[32px] font-medium text-[#282728] tracking-tight leading-tight mb-2">
                    Reset your <span className="italic font-light text-[#436235]">password</span>
                </h1>
                <p className="text-sm text-[#282728]/55 font-light mb-8">
                    Enter the email on your account and we’ll send you a secure link to set a new password.
                </p>

                {flash.success ? (
                    <div className="rounded-xl bg-[#f3f6f1] border border-[#436235]/20 px-5 py-4 text-sm text-[#436235]">
                        {flash.success}
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-[12px] font-medium text-[#282728]/70 mb-2">Your Email</label>
                            <div className="relative">
                                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData("email", e.target.value)}
                                    autoComplete="username"
                                    placeholder="you@example.com"
                                    className="font-urbanist w-full pl-11 pr-4 py-3.5 rounded-xl text-[14px] bg-white border border-[#282728]/20 text-[#282728] outline-none focus:border-[#282728] hover:border-[#282728]/35 transition-colors placeholder:text-gray-300 placeholder:font-light"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500 font-light mt-1.5 pl-1">{errors.email}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="font-urbanist w-full inline-flex items-center justify-center gap-3 bg-[#282728] text-white py-4 rounded-xl text-sm font-medium hover:bg-black active:scale-[0.99] transition-all disabled:opacity-60"
                        >
                            {processing ? <><Loader size={15} className="animate-spin" /> Sending</> : <>Send reset link <ArrowRight size={15} /></>}
                        </button>
                    </form>
                )}

                <Link href="/login" className="inline-flex items-center gap-1.5 mt-8 text-[13px] text-[#282728]/55 font-medium hover:text-[#282728] transition-colors">
                    <ArrowLeft size={14} /> Back to sign in
                </Link>
            </div>
        </div>
    );
}
