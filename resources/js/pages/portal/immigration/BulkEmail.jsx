// Immigration Bulk Email — reuses the sales BulkEmail screen under this portal's
// layout. Thin wrapper (own layout binding); BulkEmailController feeds the
// department basePath so posts target /portal/immigration/bulk-email.
import BulkEmailView from '@/pages/portal/sales/BulkEmail';

export default function ImmigrationBulkEmail(props) {
    return <BulkEmailView {...props} />;
}
