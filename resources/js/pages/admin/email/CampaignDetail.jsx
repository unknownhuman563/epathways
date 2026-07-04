import SalesCampaignDetail from "@/pages/portal/sales/CampaignDetail";

// Admin campaign detail — same page as Sales, under the admin layout.
export default function AdminCampaignDetail(props) {
    return <SalesCampaignDetail {...props} />;
}
