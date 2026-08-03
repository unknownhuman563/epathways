import TrackingPage from '@/pages/track/TrackingPage';

/**
 * Authenticated "Application Tracker" for the lead portal. Reuses the exact
 * public tracker UI (TrackingPage) in `embedded` mode — no Navbar/Footer/hero,
 * since LeadLayout already provides the chrome — fed by the same payload the
 * public /track/{code} page uses, resolved from the signed-in lead's record.
 */
export default function Tracker(props) {
    return <TrackingPage {...props} embedded />;
}
