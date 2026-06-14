<x-mail::message>
# An update on your document, {{ $firstName }}

@if($approved)
Good news — your document **{{ $documentName }}** has been **approved**. No further action is needed for this one.
@else
Your document **{{ $documentName }}** **needs attention** and couldn't be accepted as-is.

@if($reason)
**Reason:** {{ $reason }}
@endif

Please re-upload a corrected version from your tracker when you can.
@endif

<x-mail::button :url="$trackUrl">
Open my tracker
</x-mail::button>

If the button doesn't work, copy and paste this URL into your browser:

{{ $trackUrl }}

Ngā mihi,<br>
The ePathways team
</x-mail::message>
