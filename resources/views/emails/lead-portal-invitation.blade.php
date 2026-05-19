<x-mail::message>
# Welcome to your ePathways portal, {{ $firstName }}

Our team has set up secure portal access for you. Through your portal you can:

- Track the progress of your application
- Upload requested documents directly
- View communications and updates from your ePathways advisers
- Manage your contact details

To activate your account, set your password using the link below.

<x-mail::button :url="$setupUrl" color="success">
Set up my portal
</x-mail::button>

This link is valid for **7 days** and can only be used once. If you didn't request portal access, you can safely ignore this email.

Your reference: **{{ $leadId }}**

Ngā mihi,<br>
The ePathways team
</x-mail::message>
