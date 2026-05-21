import { Head } from "@inertiajs/react";
import { CreditCard } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import ComingSoonPanel from "@/components/portal/ComingSoonPanel";

export default function LeadPayments({ lead }) {
    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <Head title="Payments" />
            <PortalPageHeader
                eyebrow="Billing"
                title="Payments"
                description="Your payment plan, history, and outstanding balance."
            />
            <ComingSoonPanel
                icon={<CreditCard size={22} />}
                title="Your payments will live here"
                lines={[
                    "Full breakdown by component (consultancy, application fees, visa).",
                    "Payment plan with due dates and your outstanding balance.",
                    "Complete payment history with receipts.",
                    "Bank details for transfer, plus a button to mark a payment as paid (your adviser will confirm).",
                ]}
            />
        </div>
    );
}
