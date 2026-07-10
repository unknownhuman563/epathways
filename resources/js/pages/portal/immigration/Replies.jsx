// Immigration Email Replies — reuses the admin Replies inbox under this portal's
// layout. Thin wrapper; EmailReplyController feeds the department basePath.
import RepliesView from '@/pages/admin/email/Replies';

export default function ImmigrationReplies(props) {
    return <RepliesView {...props} />;
}
