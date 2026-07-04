import SalesBulkEmail from "@/pages/portal/sales/BulkEmail";

// Bulk SMS is the exact bulk-mail campaign feature (compose from a template,
// pick recipients, send now or schedule, history) — just on the SMS channel,
// under the admin layout.
export default function AdminBulkSms(props) {
    return <SalesBulkEmail {...props} channel="sms" />;
}
