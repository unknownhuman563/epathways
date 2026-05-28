// Education department reviews — reuses the Immigration admin page,
// just scopes data + URLs to the education department. The shared
// component is dept-aware via the `department` prop.
import UserReviews from '@/pages/admin/Immigration/UserReviews';

export default function EducationUserReviews(props) {
    return <UserReviews {...props} department="education" />;
}
