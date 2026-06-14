import { useState } from "react";
import { useForm, Head, Link } from "@inertiajs/react";
import { Mail, Lock, ArrowRight, Eye, EyeOff, Loader } from "react-feather";
import Logo from "@assets/newlogosite.png";

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token || "",
        email: email || "",
        password: "",
        password_confirmation: "",
    });
    const [show, setShow] = useState(false);

    const submit = (e) => {
        e.preventDefault();
        post("/reset-password");
    };

    return (
        <div className="min-h-screen bg-white font-urbanist flex items-center justify-center px-6 py-12">
            <Head title="Set a new password — ePathways" />

            <div className="w-full max-w-[420px]">
                <Link href="/" className="inline-flex items-center gap-2 mb-10">
                    <img src={Logo} alt="ePathways" className="h-10 w-auto" />
                </Link>

                <h1 className="text-[32px] font-medium text-[#282728] tracking-tight leading-tight mb-2">
                    Set a new <span className="italic font-light text-[#436235]">password</span>
                </h1>
                <p className="text-sm text-[#282728]/55 font-light mb-8">
                    Choose a strong password — at least 8 characters with upper &amp; lower case and a number.
                </p>

                <form onSubmit={submit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-[12px] font-medium text-[#282728]/70 mb-2">Email</label>
                        <div className="relative">
                            <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                            <input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData("email", e.target.value)}
                                autoComplete="username"
                                className="font-urbanist w-full pl-11 pr-4 py-3.5 rounded-xl text-[14px] bg-[#f7f8f6] border border-[#282728]/15 text-[#282728]/70 outline-none"
                                readOnly
                            />
                        </div>
                        {errors.email && <p className="text-xs text-red-500 font-light mt-1.5 pl-1">{errors.email}</p>}
                    </div>

                    {["password", "password_confirmation"].map((field, i) => (
                        <div key={field}>
                            <label htmlFor={field} className="block text-[12px] font-medium text-[#282728]/70 mb-2">
                                {i === 0 ? "New password" : "Confirm password"}
                            </label>
                            <div className="relative">
                                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                                <input
                                    id={field}
                                    type={show ? "text" : "password"}
                                    value={data[field]}
                                    onChange={(e) => setData(field, e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="••••••••••••"
                                    className="font-urbanist w-full pl-11 pr-12 py-3.5 rounded-xl text-[14px] bg-white border border-[#282728]/20 text-[#282728] outline-none focus:border-[#282728] hover:border-[#282728]/35 transition-colors placeholder:text-gray-300 tracking-wider"
                                />
                                {i === 0 && (
                                    <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg text-gray-400 hover:text-[#282728] hover:bg-[#f7f8f6] flex items-center justify-center transition-colors" aria-label={show ? "Hide" : "Show"}>
                                        {show ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                )}
                            </div>
                            {errors[field] && <p className="text-xs text-red-500 font-light mt-1.5 pl-1">{errors[field]}</p>}
                        </div>
                    ))}

                    <button
                        type="submit"
                        disabled={processing}
                        className="font-urbanist w-full inline-flex items-center justify-center gap-3 bg-[#282728] text-white py-4 rounded-xl text-sm font-medium hover:bg-black active:scale-[0.99] transition-all disabled:opacity-60"
                    >
                        {processing ? <><Loader size={15} className="animate-spin" /> Saving</> : <>Reset password <ArrowRight size={15} /></>}
                    </button>
                </form>

                <Link href="/login" className="block text-center mt-8 text-[13px] text-[#282728]/55 font-medium hover:text-[#282728] transition-colors">
                    Back to sign in
                </Link>
            </div>
        </div>
    );
}
