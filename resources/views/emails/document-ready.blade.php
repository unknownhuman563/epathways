<x-mail::message>
# Your {{ $nounTitle }} is ready, {{ $firstName }}

We've prepared your {{ $noun }} and it's waiting on your personal tracker. Open the link below to review it — no login required.

Through your tracker you can:

- Review the {{ $noun }} we prepared for you
- Download or share it as a PDF
- See your overall application progress
- Reach out if anything needs adjusting

<x-mail::button :url="$trackUrl">
Open my tracker
</x-mail::button>

If the button doesn't work, copy and paste this URL into your browser:

{{ $trackUrl }}

Please keep this link private — anyone with it can view your application.

Ngā mihi,<br>
The ePathways team
</x-mail::message>
