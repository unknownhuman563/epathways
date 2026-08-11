import CaseProfile from "@/pages/portal/immigration/CaseProfile";

// Adviser-portal case profile — reuses the manager portal's full case profile
// component, but as a DISTINCT page so it wraps in the adviser layout (app.jsx
// mutates page.default.layout, so a bare re-export would share the manager's).
export default function AdviserCaseProfile(props) {
    return <CaseProfile {...props} />;
}
