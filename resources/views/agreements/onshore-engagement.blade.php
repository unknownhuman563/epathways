{{--
    ONSHORE Engagement Agreement — for applicants already in New Zealand.
    An EDUCATION engagement that is FREE OF CHARGE (no consultancy fees); eP
    acts as education agent and refers the client to a Licensed Immigration
    Adviser for visa matters.

    Payload: $client_name, $client_reference, $business_number, $agreement_date,
    $signer_name, $signer_signature, $client_signature (tracker sign),
    $acknowledged, $preview.
--}}
@php
    $preview = $preview ?? false;
    $logoSrc = $preview ? asset('images/ep-logo.png') : public_path('images/ep-logo.png');
    $font = fn ($file) => $preview ? asset("fonts/urbanist/{$file}") : public_path("fonts/urbanist/{$file}");
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Engagement Agreement — {{ $client_name }}</title>
<style>
    @font-face { font-family: 'Urbanist'; font-style: normal; font-weight: 400; src: url('{{ $font("Urbanist-Regular.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: italic; font-weight: 400; src: url('{{ $font("Urbanist-Italic.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: normal; font-weight: 700; src: url('{{ $font("Urbanist-Bold.ttf") }}') format('truetype'); }

    @page { margin: 144px 62px 75px 62px; }
    body.preview { padding: 24px 62px; }
    body { font-family: 'Urbanist', DejaVu Sans, sans-serif; font-size: 10pt; color: #111; line-height: 1.45; }

    @media screen {
        body { max-width: 794px; margin: 0 auto; padding: 24px 55px; background: #fff; }
        .page-header { position: static; text-align: center; margin: -8px 0 12px 0; }
        .page-header img { height: 88px; }
    }

    .page-header { position: fixed; top: -116px; left: 0; right: 0; text-align: center; border-bottom: 1.5px solid #436235; padding-bottom: 10px; }
    .page-header img { height: 100px; width: auto; }
    .page-header.in-flow { position: static; margin-bottom: 16px; }
    .page-footer { position: fixed; bottom: -34px; left: 0; right: 0; border-top: 1.5px solid #436235; }

    .page-break { page-break-before: always; }
    .no-break { page-break-inside: avoid; }
    .eyebrow { text-align: center; color: #436235; font-weight: bold; font-size: 9pt; letter-spacing: 2px; margin-bottom: 6px; }
    h1 { text-align: center; font-size: 21pt; font-weight: 900; letter-spacing: 1px; margin: 0 0 2px 0; color: #14213b; }
    .subtitle { text-align: center; color: #555; font-size: 10pt; font-style: italic; margin-bottom: 16px; }
    hr { border: 0; border-top: 1.5px solid #436235; margin: 14px 0; }
    .article-bar { text-align: center; font-weight: bold; color: #436235; font-size: 11pt; letter-spacing: 1px; padding: 5px 0; border-top: 1.5px solid #436235; border-bottom: 1.5px solid #436235; margin: 15px 0 11px 0; }
    h3 { color: #436235; font-size: 10.5pt; margin: 12px 0 5px 0; }
    p { margin: 7px 0; text-align: justify; }
    ul { margin: 6px 0 10px 20px; padding: 0; }
    li { margin: 4px 0; font-size: 10pt; }
    .strong { font-weight: bold; }
    .company-name { font-weight: bold; font-style: italic; }

    table.info { width: 100%; border-collapse: collapse; margin: 10px 0 14px 0; }
    table.info td { border: 1px solid #b7ceac; padding: 8px 12px; font-size: 10pt; vertical-align: top; }
    table.info td.key { width: 34%; background: #f4f8f0; font-weight: bold; color: #14213b; }

    .free-badge { display: block; text-align: center; background: #14213b; color: #fff; font-weight: bold; letter-spacing: 1px; padding: 8px; margin: 10px 0; font-size: 11pt; }

    table.stage { width: 100%; border-collapse: collapse; margin: 8px 0 12px 0; }
    table.stage th { background: #436235; color: #fff; text-align: left; padding: 5px 10px; font-size: 9.5pt; }
    table.stage td { border: 1px solid #d8d8d8; padding: 5px 10px; font-size: 9.5pt; }

    .signature-table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    .signature-table th { background: #436235; color: #fff; text-align: center; padding: 6px; font-size: 10pt; }
    .signature-table td { border: 1px solid #436235; padding: 12px; vertical-align: top; font-size: 10pt; width: 50%; height: 74px; }
    .sig-name { font-weight: bold; text-align: center; margin-top: 20px; }
    .sig-role { text-align: center; font-style: italic; color: #555; font-size: 9pt; }
    .sig-meta-row td { padding: 6px 12px; height: auto; }
    .ack-box { border-left: 4px solid #436235; padding: 8px 12px; margin-top: 14px; font-weight: bold; font-size: 10pt; background: #f4f8f0; }
</style>
</head>
<body class="{{ $preview ? 'preview' : '' }}">

<div class="page-header{{ $preview ? ' in-flow' : '' }}">
    <img src="{{ $logoSrc }}" alt="ePathways">
</div>
@unless ($preview)<div class="page-footer"></div>@endunless

<div class="eyebrow">OFFICIAL DOCUMENT &nbsp;•&nbsp; CONFIDENTIAL</div>
<h1>ENGAGEMENT AGREEMENT</h1>
<div class="subtitle">Employment Pathways Limited t/a &ldquo;eP&rdquo;</div>
<hr>

<p>This Engagement Agreement (&ldquo;Agreement&rdquo;) delineates the terms and conditions governing the provision of services by <span class="company-name">Employment Pathways Limited t/a &ldquo;eP&rdquo;</span> (&ldquo;Company&rdquo;) to <span class="strong">{{ $client_name ?: 'Client Name' }}</span> (&ldquo;you&rdquo;), pertaining to your educational and visa process through our Licensed Immigration Adviser Partner in New Zealand. It is imperative that you thoroughly scrutinize the ensuing terms and signify your acceptance by executing and furnishing a copy of this Agreement.</p>

<p>This Engagement Agreement (&ldquo;Agreement&rdquo;) is entered into between:</p>

<table class="info no-break">
    <tr><td class="key">Client Name</td><td>{{ $client_name ?: 'Client Name' }} <span style="color:#555;">(&ldquo;Client&rdquo;)</span></td></tr>
    <tr><td class="key">Company Name</td><td>Employment Pathways Limited <span style="color:#555;">(&ldquo;Agent&rdquo;)</span></td></tr>
    <tr><td class="key">Business Number</td><td>{{ $business_number }}</td></tr>
    <tr><td class="key">Date</td><td>{{ $agreement_date }}</td></tr>
</table>

<div class="article-bar">PURPOSE OF AGREEMENT</div>
<p>This Agreement confirms that the Client engages Employment Pathways Limited as their authorized education agent for the purpose of providing advice and assistance with school application, documentation, and education pathway planning.</p>
<p>This engagement does not include immigration advice, and no consultancy or professional fees will be charged to the Client by the Agent.</p>

<div class="article-bar">SCOPE OF SERVICES</div>
<p>The following summarizes the services provided and their corresponding fees:</p>
<table class="info no-break">
    <tr><td>Initial consultation and goal-setting meeting</td></tr>
    <tr><td>Document collection and evaluation</td></tr>
    <tr><td>School selection advice and application support</td></tr>
    <tr><td>Assistance with Statement of Purpose / Letter of Intent</td></tr>
    <tr><td>Coordination with Licensed Immigration Adviser (LIA)</td></tr>
    <tr><td>Liaison with educational institutions for Offer of Place</td></tr>
    <tr><td>General support and updates throughout the application process</td></tr>
</table>
<div class="free-badge">FREE OF CHARGE</div>

<p>The Client acknowledges that eP does not charge any consultancy, advisory, or processing fees for the services related to school application and enrollment support.</p>
<p>All support services&mdash;such as documentation review, education pathway guidance, assistance with school application forms, and communication with education providers&mdash;are provided free of charge by the Agent.</p>
<p>However, the Client understands that certain disbursements and third-party costs may arise during the process. These may include, but are not limited to:</p>
<ul>
    <li>English proficiency test fees (IELTS / PTE);</li>
    <li>Tuition deposits required by the school;</li>
    <li>Medical exams or insurance;</li>
    <li>Visa application fees (to be handled by the Licensed Immigration Adviser);</li>
    <li>Airfare and personal travel expenses.</li>
</ul>
<p>Such costs shall be paid directly by the Client to the relevant service providers or institutions. These expenses are not covered by this Agreement and fall outside the Agent&rsquo;s responsibilities.</p>

<h3>Scope of Services</h3>
<p>The Agent shall provide the following services:</p>
<ul>
    <li>Review of the Client&rsquo;s educational documents (e.g., passport, CV, graduate certificates, transcripts) via secure online forms;</li>
    <li>Conduct a goal-setting meeting to discuss educational pathways aligned with the Client&rsquo;s circumstances;</li>
    <li>Assist with school application and enrollment including:
        <ul>
            <li>Completion of forms and compilation of requirements;</li>
            <li>Drafting of the Letter of Intent / Statement of Purpose;</li>
            <li>Arrangement of entrance exams or interviews;</li>
            <li>Liaison with institutions to secure an Offer of Place.</li>
        </ul>
    </li>
</ul>

<div class="article-bar">ENGLISH PROFICIENCY SUPPORT (IF REQUIRED)</div>
<p>If the Client wishes to seek assistance with English Proficiency Test preparation (IELTS or PTE), eP can provide personalized support as an optional paid service. The associated fees and services are outlined below:</p>
<p><em>Please note: It is explicitly acknowledged that the fees rendered for our services become <strong>non-refundable</strong> once work has commenced. Any refund requests will be assessed on a case-by-case basis at the sole discretion of eP.</em></p>
<table class="stage no-break">
    <thead>
        <tr><th style="width:12%;">Stage</th><th>Description</th><th style="width:30%;">Amount (NZD)</th></tr>
    </thead>
    <tbody>
        <tr><td>1</td><td>English Review and Mock Test Exam</td><td>Separate engagement</td></tr>
        <tr><td>2</td><td>English Exam Booking</td><td>Separate engagement</td></tr>
    </tbody>
</table>

<h3>English Proficiency Test Preparation</h3>
<p>The Company shall provide personalized assistance to help the Client prepare for the English Proficiency Test (IELTS or PTE). This includes:</p>
<ul>
    <li><strong>One-on-One Online Review:</strong> A dedicated English Personal Tutor will devise a personalized review schedule spanning at least 30 hours.</li>
    <li><strong>Test Booking Assistance:</strong> The Company will assist in scheduling the test at the closest testing center.</li>
    <li><strong>Exam Preparation Guidance:</strong> The tutor will provide strategic tips, exercises, and coaching.</li>
    <li><strong>Progress Monitoring:</strong> Regular progress updates will be given (weekly, fortnightly, or as required).</li>
    <li><strong>Mock Test:</strong> A full-length mock exam is included with instant scoring, feedback, and review.</li>
</ul>

<h3>Exam Booking</h3>
<p>The Company facilitates the English test booking process on behalf of the client. The Company ensures accurate scheduling and registration using the information provided by client.</p>
<p>You acknowledge that the Company does not guarantee a specific test score but commits to providing full support to enhance your preparation and performance.</p>

<div class="article-bar">REFERRAL TO LICENSED IMMIGRATION ADVISER (LIA)</div>
<p>The Client acknowledges that all visa-related advice and services will be provided by a Licensed Immigration Adviser (LIA), in accordance with the Immigration Advisers Licensing Act 2007. The Agent is not authorized to provide immigration advice and will solely assist with coordination and documentation support.</p>
<p>Upon school enrollment confirmation, the Client will be formally referred to the LIA.</p>
<p>The LIA will issue a separate engagement agreement and invoice to the Client outlining the scope and terms of immigration services. By signing this Agreement, the Client confirms that they understand the distinction between education agent services and immigration services, and agrees to work separately with the assigned Licensed Immigration Adviser for all visa-related matters.</p>

<div class="article-bar">ACKNOWLEDGEMENT AND EXCLUSIVITY</div>
<p>The Client acknowledges and agrees that:</p>
<ul>
    <li>Employment Pathways Limited is their exclusive education agent for this engagement;</li>
    <li>The Agent is authorized to act on the Client&rsquo;s behalf in dealings with education providers;</li>
    <li>If the Client later engages another agent, this Agreement shall serve as documentation of prior engagement.</li>
</ul>

<div class="article-bar">CONFIDENTIALITY AND DATA PRIVACY</div>
<p>The Agent agrees to:</p>
<ul>
    <li>Collect and process the Client&rsquo;s information in compliance with the New Zealand Privacy Act 2020;</li>
    <li>Ensure that only authorized personnel handle sensitive information;</li>
    <li>Secure and protect all client data from unauthorized disclosure.</li>
</ul>

<div class="article-bar">TERMINATION</div>
<p>This Agreement may be terminated by either party at any time through written notice (including by email). Services rendered prior to termination shall remain covered under this Agreement.</p>

<div class="article-bar">DISBURSEMENTS AND OTHER DIRECT COSTS</div>
<p>The Client is solely responsible for any additional third-party expenses, including visa application fees; medical exams or insurance; test fees and travel costs. These expenses are not included in the Agent&rsquo;s scope of services.</p>

<div class="article-bar">LIMITATION OF LIABILITY</div>
<p>The Agent is not responsible for outcomes of visa applications; delays or decisions by government agencies or schools; or errors caused by inaccurate or incomplete information from the Client.</p>

<div class="article-bar">GOVERNING LAW</div>
<p>This Agreement is governed by and construed in accordance with the laws of New Zealand. Disputes arising from this Agreement shall be subject to New Zealand jurisdiction.</p>

<div class="article-bar">ENTIRE AGREEMENT</div>
<p>This Agreement contains the full understanding between both parties and supersedes all prior verbal or written agreements. Any amendment must be in writing and signed by both parties.</p>

<div class="article-bar">ACCEPTANCE AND CONFIRMATION</div>
<p>By signing below, both parties confirm that they understand and agree to the terms of this Agreement.</p>

<table class="signature-table">
    <thead>
        <tr><th>Signed by the Client</th><th>Signed by the Agent</th></tr>
    </thead>
    <tbody>
        <tr>
            <td style="text-align:center;">
                <img id="ep-client-signature"
                    src="{{ $client_signature ?? '' }}"
                    alt="Client signature"
                    style="max-height:48px; max-width:160px; margin:0 auto 2px auto; display:{{ ! empty($client_signature ?? null) ? 'block' : 'none' }};">
                <div id="ep-client-sig-fallback" style="font-style:italic; font-size:8pt; color:#888; text-align:left; display:{{ empty($client_signature ?? null) ? 'block' : 'none' }};">
                    Insert your e-signature above, or place a check mark (&#10004;) below if unavailable.
                </div>
                <div id="ep-client-sig-name" class="sig-name" style="margin-top:{{ ! empty($client_signature ?? null) ? '0' : '20px' }};">{{ $client_name ?: 'Client Name' }}</div>
                <div class="sig-role">Client</div>
            </td>
            <td style="text-align:center;">
                @if (! empty($signer_signature))
                    <img src="{{ $signer_signature }}" alt="Signature" style="max-height:48px; max-width:160px; margin:0 auto 2px auto; display:block;">
                @endif
                <div class="sig-name" style="margin-top:{{ ! empty($signer_signature) ? '0' : '20px' }};">{{ $signer_name ?? 'Dinah Suarin' }}</div>
                <div class="sig-role">Director &nbsp;·&nbsp; On behalf of Employment Pathways Limited</div>
            </td>
        </tr>
        <tr class="sig-meta-row">
            <td><strong>Date:</strong> ____________________________</td>
            <td><strong>Date:</strong> ____________________________</td>
        </tr>
    </tbody>
</table>

<div class="ack-box">
    <span id="ep-ack-mark">{!! ($acknowledged ?? false) ? '&#9745;' : '&#9744;' !!}</span>&nbsp;&nbsp; I have read and agreed to the terms of this Engagement Agreement.
</div>

@if (($preview ?? false))
    <script>
        (function () {
            var sigImg = document.getElementById('ep-client-signature');
            var sigFallback = document.getElementById('ep-client-sig-fallback');
            var sigName = document.getElementById('ep-client-sig-name');
            var ackMark = document.getElementById('ep-ack-mark');
            window.addEventListener('message', function (e) {
                var d = e.data || {};
                if (d.type === 'applicant-signature') {
                    if (d.value) {
                        if (sigImg) { sigImg.src = d.value; sigImg.style.display = 'block'; }
                        if (sigFallback) sigFallback.style.display = 'none';
                        if (sigName) sigName.style.marginTop = '0';
                    } else {
                        if (sigImg) { sigImg.src = ''; sigImg.style.display = 'none'; }
                        if (sigFallback) sigFallback.style.display = 'block';
                        if (sigName) sigName.style.marginTop = '20px';
                    }
                } else if (d.type === 'acknowledged') {
                    if (ackMark) ackMark.innerHTML = d.value ? '&#9745;' : '&#9744;';
                }
            });
        })();
    </script>
@endif

<script type="text/php">
    if (isset($pdf)) {
        $font = $fontMetrics->getFont('DejaVu Sans', 'bold');
        $size = 7.5;
        $text = 'Employment Pathways Limited t/a eP  |  Engagement Agreement  |  Page {PAGE_NUM} of {PAGE_COUNT}';
        $x = ($pdf->get_width() - $fontMetrics->getTextWidth($text, $font, $size)) / 2;
        $pdf->page_text($x, $pdf->get_height() - 46, $text, $font, $size, [0.26, 0.38, 0.21]);
    }
</script>

</body>
</html>
