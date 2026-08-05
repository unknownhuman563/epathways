import { router } from '@inertiajs/react';
import TrackingPage from '@/pages/track/TrackingPage';

// Each tracker tab is a sidebar page in the lead portal.
const TAB_ROUTES = {
    overview: '/portal/lead/dashboard',
    visa:     '/portal/lead/requirements',
    profile:  '/portal/lead/profile',
};

/**
 * Authenticated lead-portal view of the tracker. Reuses the public tracker UI
 * (TrackingPage) in `embedded` + `sidebarTabs` mode: the Overview / Requirements
 * / My Profile tabs are driven by the LeadLayout sidebar (one route each) rather
 * than an in-page tab strip. `initialTab` comes from the controller per route.
 */
export default function Tracker({ initialTab = 'overview', ...props }) {
    return (
        <TrackingPage
            {...props}
            embedded
            sidebarTabs
            initialTab={initialTab}
            onTabNavigate={(tab) => router.visit(TAB_ROUTES[tab] || TAB_ROUTES.overview)}
        />
    );
}
