import { Head, Link } from "@inertiajs/react";
import { AlertTriangle, ArrowRight } from "react-feather";
import Logo from "@assets/newlogosite.png";

export default function InvitationInvalid() {
    return (
        <div className="min-h-screen bg-[#f7f8f6] font-urbanist flex items-center justify-center px-6 py-12">
            <Head title="Invitation expired" />

            <div className="w-full max-w-md text-center">
                <img src={Logo} alt="ePathways" className="h-9 mx-auto mb-10" />

                <div className="bg-white rounded-2xl border border-[#282728]/15 p-10 shadow-[0_30px_60px_-30px_rgba(40,39,40,0.18)]">
                    <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                        <AlertTriangle size={26} strokeWidth={2} />
                    </div>

                    <h1 className="text-2xl font-medium text-[#282728] tracking-tight mb-3">
                        This invitation can&apos;t be used
                    </h1>
                    <p className="text-sm text-gray-500 font-light leading-relaxed mb-7">
                        The link has expired, has already been used, or was revoked. Please contact your ePathways adviser to request a fresh invitation.
                    </p>

                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2.5 bg-[#282728] text-white text-[11px] font-bold px-6 py-3 rounded-xl hover:bg-black active:scale-[0.99] transition-all uppercase tracking-[0.22em]"
                    >
                        Back to ePathways
                        <ArrowRight size={13} strokeWidth={2.5} />
                    </Link>
                </div>

                <p className="text-center text-[10px] text-gray-400 font-light mt-6">
                    Need help? Email <a href="mailto:info@epathways.co.nz" className="underline">info@epathways.co.nz</a>
                </p>
            </div>
        </div>
    );
}
