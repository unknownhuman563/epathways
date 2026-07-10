// Education Campaign detail — reuses the sales CampaignDetail screen under this
// portal's layout. Thin wrapper so it gets its own layout binding.
import CampaignDetailView from '@/pages/portal/sales/CampaignDetail';

export default function EducationCampaignDetail(props) {
    return <CampaignDetailView {...props} />;
}
