// Immigration Bulk SMS — reuses the admin SMS screen under this portal's layout.
// Thin wrapper; BulkEmailController feeds the department basePath.
import SmsView from '@/pages/admin/email/Sms';

export default function ImmigrationSms(props) {
    return <SmsView {...props} />;
}
