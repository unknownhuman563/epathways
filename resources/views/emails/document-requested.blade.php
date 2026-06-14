<x-mail::message>
# We need a document from you, {{ $firstName }}

To keep your ePathways application moving, our team has requested:

**{{ $documentLabel }}**

@if($description)
> {{ $description }}
@endif

You can upload it securely from your tracker — no login required:

<x-mail::button :url="$trackUrl">
Upload my document
</x-mail::button>

If the button doesn't work, copy and paste this URL into your browser:

{{ $trackUrl }}

Ngā mihi,<br>
The ePathways team
</x-mail::message>
