<x-mail::message>
# Your ePathways portal is ready, {{ $firstName }}

Our team has created secure portal access for you. Use the details below to log in.

<x-mail::panel>
**Email:** {{ $email }}
**Password:** {{ $password }}
</x-mail::panel>

<x-mail::button :url="$loginUrl" color="success">
Log in to my portal
</x-mail::button>

Once you're in you can track your application, upload requested documents, and view updates from your ePathways advisers.

## Please change your password

For your security, change this password after you log in for the first time — go to **Profile → Security → Password** inside the portal. If you ever forget it, use the **"Forgot password?"** link on the login page, or the button below, to reset it at any time:

<x-mail::button :url="$resetUrl" color="primary">
Reset my password
</x-mail::button>

Your reference: **{{ $leadId }}**

If you didn't expect this email, please contact your ePathways adviser.

Ngā mihi,<br>
The ePathways team
</x-mail::message>
