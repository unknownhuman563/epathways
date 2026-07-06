import SalesBulkEmail from "@/pages/portal/sales/BulkEmail";

// Admin Bulk Email is the exact Sales bulk-email feature (campaigns, schedule,
// history) — just rendered under the admin layout with an admin basePath.
export default function AdminBulkMail(props) {
    return <SalesBulkEmail {...props} />;
}
