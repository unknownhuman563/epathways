{{-- Visual-builder emails are already complete, self-contained HTML documents
     (produced by the drag-and-drop editor), so we emit them verbatim without the
     branded shell. Variables were already substituted in CommunicationService. --}}
{!! $bodyHtml !!}
