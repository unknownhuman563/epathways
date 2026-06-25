<x-mail::message>
# Track your ePathways application, {{ $firstName }}

Everything for your {{ $context }} now lives in one place — your personal tracker. There's **no login**: just keep the link below safe.

Through your tracker you can:

- See your application progress at a glance
- Upload the documents we ask for
- Keep your contact and personal details up to date

<x-mail::button :url="$trackUrl">
Open my tracker
</x-mail::button>

If the button doesn't work, copy and paste this URL into your browser:

{{ $trackUrl }}

Please keep this link private — anyone with it can view your application.

Ngā mihi,<br>
The ePathways team
</x-mail::message>
