import Notifications from "@/pages/portal/immigration/Notifications";

// Adviser-portal notifications — reuses the immigration notifications screen as
// a distinct page so it renders under the adviser layout.
export default function AdviserNotifications(props) {
    return <Notifications {...props} />;
}
