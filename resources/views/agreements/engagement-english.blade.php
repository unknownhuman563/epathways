{{--
    English Engagement Agreement — PTE preparation services. Single variant
    (no Single/Partner split like the Consultancy template). Rendered to PDF
    by AgreementGenerator::englishEngagement().

    Vars expected:
        $client_name     — lead's full name
        $client_reference — slugified name for bank reference
        $generated_at_formatted — "26th day of May 2026"
--}}
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>English Engagement Agreement</title>
<style>
    @font-face { font-family: 'Urbanist'; font-style: normal; font-weight: 400; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Regular.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: italic; font-weight: 400; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Italic.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: normal; font-weight: 700; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Bold.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: italic; font-weight: 700; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-BoldItalic.ttf") }}') format('truetype'); }

    @page { margin: 120px 60px 70px 60px; }
    body { font-family: 'Urbanist', DejaVu Sans, sans-serif; font-size: 12pt; color: #111; line-height: 1.5; }
    .page-header { position: fixed; top: -80px; left: 0; right: 0; text-align: center; }
    .page-header img { height: 60px; width: auto; }

    /* Screen-only preview measure — see consultancy.blade.php for
       the rationale. Same 794px A4 measure so the iframe preview
       wraps at the printed page width. */
    @media screen {
        body { max-width: 794px; margin: 0 auto; padding: 24px 60px; background: #fff; }
        .page-header { position: static; text-align: center; margin: -8px 0 12px 0; }
        .page-header img { height: 56px; }
    }
    .eyebrow { text-align: center; color: #436235; font-weight: bold; font-size: 9pt; letter-spacing: 2px; margin-bottom: 6px; }
    h1 { text-align: center; font-size: 22pt; font-weight: 900; letter-spacing: 1px; margin: 0 0 4px 0; color: #1a1a1a; }
    .subtitle { text-align: center; color: #555; font-size: 10pt; font-style: italic; margin-bottom: 18px; }
    hr { border: 0; border-top: 1.5px solid #436235; margin: 14px 0; }
    .article-bar { text-align: center; font-weight: bold; color: #436235; font-size: 11pt; letter-spacing: 1.2px; padding: 4px 0; border-top: 1.5px solid #436235; border-bottom: 1.5px solid #436235; margin: 22px 0 14px 0; }
    h3 { color: #436235; font-size: 11pt; margin-top: 16px; margin-bottom: 6px; }
    p { margin: 8px 0; text-align: justify; }
    table.fees { width: 100%; border-collapse: collapse; margin: 10px 0; }
    table.fees thead th { background: #436235; color: #fff; text-align: left; padding: 8px 10px; font-size: 10pt; }
    table.fees thead th.right { text-align: right; }
    table.fees thead th.center { text-align: center; }
    table.fees tbody td { padding: 8px 10px; border-bottom: 1px solid #d8d8d8; font-size: 10pt; vertical-align: top; }
    table.fees tbody td.right { text-align: right; font-weight: bold; }
    table.fees tbody td.center { text-align: center; }
    .bank-box { border: 1px solid #436235; padding: 10px 14px; margin: 8px 0 16px 0; }
    .bank-box .row { padding: 2px 0; font-size: 10pt; }
    .bank-box .label { display: inline-block; width: 130px; color: #555; }
    .bank-box .heading { color: #436235; font-weight: bold; margin-bottom: 6px; }
    ol, ul { margin: 6px 0 10px 22px; padding: 0; }
    ol li, ul li { margin: 4px 0; font-size: 10pt; }
    .strong { font-weight: bold; }
    .signature-table { width: 100%; border-collapse: collapse; margin-top: 22px; }
    .signature-table th { background: #436235; color: #fff; text-align: center; padding: 6px; font-size: 10pt; }
    .signature-table td { border: 1px solid #436235; padding: 12px; vertical-align: top; height: 70px; font-size: 10pt; width: 50%; }
    .sig-name { font-weight: bold; text-align: center; margin-top: 22px; }
    .sig-role { text-align: center; font-style: italic; color: #555; font-size: 9pt; }
    .sig-meta-row td { padding: 6px 12px; height: auto; }
    .ack-box { border: 1px solid #436235; padding: 8px 12px; margin-top: 14px; font-weight: bold; font-size: 10pt; }
    .insert-name { color: #436235; font-weight: bold; }
    .footer-rule { border-top: 1px solid #d8d8d8; margin-top: 24px; padding-top: 6px; font-size: 8pt; color: #888; text-align: center; }
</style>
</head>
<body>

    <div class="page-header">
        <img src="{{ base_path('resources/assets/philipine_ep_logo.png') }}" alt="ePathways Philippines">
    </div>

    <div class="eyebrow">OFFICIAL DOCUMENT &nbsp;•&nbsp; CONFIDENTIAL</div>
    <h1>ENGLISH ENGAGEMENT AGREEMENT</h1>
    <div class="subtitle">English Proficiency Test Preparation Services</div>
    <hr>

    <p>This Engagement Agreement (&ldquo;Agreement&rdquo;) delineates the terms and conditions governing the provision of English Proficiency services by <strong>Epathways Philippines Consultancy</strong> (&ldquo;Company&rdquo;) to <span class="insert-name">{{ $client_name ?: 'INSERT NAME HERE' }}</span> (&ldquo;you&rdquo;). It is imperative that you thoroughly review the ensuing terms and signify your acceptance by executing and furnishing a copy of this Agreement.</p>

    <div class="article-bar">ARTICLE 1 &nbsp;•&nbsp; FEES STRUCTURE &amp; PAYMENT PLAN</div>

    <h3>Section 1. Fees</h3>
    <p>The fees associated with English Proficiency Test preparation services are as follows:</p>

    <table class="fees">
        <thead>
            <tr>
                <th class="center" style="width:50px;">Stage</th>
                <th>Description</th>
                <th class="center" style="width:50px;">Qty</th>
                <th class="right" style="width:90px;">Price</th>
                <th class="right" style="width:110px;">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="center">1</td>
                <td>
                    <strong>English Review</strong> (Pearson Test of English) Mock Test (PTE)
                    <ul style="margin-top:4px;">
                        <li>20 hours of personalized PTE coaching</li>
                        <li>UNLIMITED mock test with assessment and feedback</li>
                        <li>Assistance with exam booking</li>
                    </ul>
                </td>
                <td class="center">1</td>
                <td class="right">14,500.00</td>
                <td class="right">14,500.00</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td class="right">TOTAL</td>
                <td class="right">Php 14,500.00</td>
            </tr>
        </tbody>
    </table>

    <p>If you wish to avail our English Pro Review, you will be required to pay the amount stated above. It is explicitly acknowledged that the fees rendered for our services become <strong>non-refundable</strong> once work has commenced. Any refund requests will be assessed on a case-by-case basis at the sole discretion of ePathways Philippines.</p>

    <table class="fees" style="margin-top:14px;">
        <thead>
            <tr>
                <th class="center" style="width:50px;">Stage</th>
                <th>Description</th>
                <th class="center" style="width:50px;">Qty</th>
                <th class="right" style="width:90px;">Price</th>
                <th class="right" style="width:110px;">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td class="center">2</td>
                <td>PTE Examination Fee</td>
                <td class="center">1</td>
                <td class="right">USD $240</td>
                <td class="right">USD $240</td>
            </tr>
            <tr>
                <td></td>
                <td></td>
                <td></td>
                <td class="right">TOTAL</td>
                <td class="right">USD $240</td>
            </tr>
        </tbody>
    </table>

    <p>Please note that the PTE Examination Fee will be paid directly through the official PTE website at <strong>https://www.pearsonpte.com/</strong>. Applicants will be redirected to the official Pearson PTE booking portal to complete their registration and payment securely. The examination fee may vary depending on the testing location and available schedule at the time of booking. We recommend booking your exam early to secure your preferred test date and location.</p>

    <h3>Section 2. Bank Details</h3>
    <div class="bank-box">
        <div class="heading">PAYMENT DETAILS</div>
        <div class="row"><span class="label">Bank Name:</span> <strong>BPI</strong></div>
        <div class="row"><span class="label">Account Name:</span> <strong>Dinah Jabone</strong></div>
        <div class="row"><span class="label">Account Number:</span> <strong>9269224808</strong></div>
        <div class="row"><span class="label">Reference:</span> <strong>#PTE{{ $client_reference }}</strong></div>
    </div>

    <div class="article-bar">ARTICLE 2 &nbsp;•&nbsp; SCOPE OF SERVICES</div>

    <h3>Section 1. Orientation and Review Program Policy</h3>
    <p>Before being endorsed to a tutor, the client is required to attend an orientation session to familiarize themselves with the review policies and procedures. During this session, the client will receive a copy of the English Review Program Policy (ERP-001), which outlines all relevant guidelines and expectations.</p>
    <p>Attendance at the orientation is mandatory and a prerequisite for proceeding with the review program and tutor assignment.</p>

    <h3>Section 2. English Proficiency Test Preparation</h3>
    <p>The Company shall provide personalized assistance to help you prepare for your English Proficiency Test (IELTS or PTE). This includes:</p>
    <ol>
        <li><strong>One-on-One Online Review</strong> &ndash; A dedicated English Personal Tutor will devise a personalized review schedule spanning a duration of at least 20 hours, tailored to your specific needs and objectives.</li>
        <li><strong>Test Booking Assistance</strong> &ndash; The Company will assist in booking your exam at the closest testing center based on your location and preferred schedule.</li>
        <li><strong>Exam Preparation Guidance</strong> &ndash; The tutor will provide strategic tips and practice exercises to ensure you are well-prepared and confident for the exam.</li>
        <li><strong>Progress Monitoring</strong> &ndash; Regular updates on your progress will be provided on a weekly, fortnightly, or as required basis.</li>
        <li><strong>Mock Test</strong> &ndash; A full-length mock exam is included as part of the preparation package. It allows the client to receive <strong>instant results</strong> with a <strong>comprehensive score report</strong>, review performance, identify strengths and areas for improvement, and practice under real exam conditions. This ensures enhanced readiness and confidence on the actual test day.</li>
    </ol>

    <h3>Section 3. English Proficiency Exam Booking</h3>
    <p>The Company facilitates the booking of the English Proficiency Exam (such as the PTE) on behalf of the client. All scheduling and registration will be completed accurately using the personal and identification information provided by the client via email.</p>
    <p>By engaging the Company for this service, the client acknowledges and agrees to the following:</p>
    <ul>
        <li>The client must provide accurate and complete personal details, including valid identification.</li>
        <li>The client should send an email to the Company indicating their preferred exam schedule.</li>
        <li>The Company may create or access the client&rsquo;s testing account (e.g., Pearson PTE) solely for booking purposes.</li>
        <li>Test dates and locations will be selected based on availability and the client&rsquo;s preferences.</li>
        <li>Exam fees must be paid in full prior to booking confirmation. The method of payment will be communicated in advance.</li>
        <li>Once payment is confirmed, the Company requires 2&ndash;3 business days to complete the booking process.</li>
        <li>A booking confirmation will be shared with the client.</li>
        <li>It is the client&rsquo;s responsibility to review and follow all exam day requirements, including ID and arrival time as stipulated in the PTE Policy.</li>
        <li>Rescheduling or cancellations are subject to the exam provider&rsquo;s policies and may incur additional charges.</li>
    </ul>
    <p>The Company does not guarantee any specific test outcome but will provide appropriate support to help the client prepare effectively.</p>

    <div class="article-bar">ARTICLE 3 &nbsp;•&nbsp; TERMINATION</div>
    <p>Either party reserves the right to terminate this Agreement by issuing a written notification. Termination shall be deemed effective upon receipt of the written notice.</p>

    <div class="article-bar">ARTICLE 4 &nbsp;•&nbsp; GOVERNING LAW</div>
    <p>This Agreement shall be subject to and interpreted in accordance with the laws prevailing in your country.</p>

    <div class="article-bar">ARTICLE 5 &nbsp;•&nbsp; DATA PRIVACY</div>
    <p>The Company shall comply with the requirements under the Data Privacy Act of 2012, ensuring that all personal data is handled securely and only authorized personnel shall have access to it. Confidentiality obligations shall be imposed on personnel handling such data.</p>

    <p>Should you concur with the terms outlined herein and elect to avail yourself of our services, kindly affix your signature and return a duplicate of this Agreement to signify your acceptance. Should any queries arise, please reach out for clarification.</p>

    <hr>

    <div class="article-bar">EXECUTION &amp; ACCEPTANCE</div>

    <p><strong>IN WITNESS WHEREOF</strong>, both parties have hereunto set their hands this <span class="strong" style="text-decoration: underline">{{ $generated_at_formatted }}</span>.</p>

    <table class="signature-table">
        <thead>
            <tr><th>CLIENT</th><th>COMPANY</th></tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align:center;">
                    <img id="ep-client-signature"
                        src="{{ $client_signature ?? '' }}"
                        alt="Client signature"
                        style="max-height:48px; max-width:160px; margin:0 auto 2px auto; display:{{ ! empty($client_signature ?? null) ? 'block' : 'none' }};">
                    <div id="ep-client-sig-fallback" style="font-style:italic; font-size:8pt; color:#888; text-align:left; display:{{ empty($client_signature ?? null) ? 'block' : 'none' }};">
                        Insert your e-signature above, or place a check mark (✓) below if unavailable.
                    </div>
                    <div id="ep-client-sig-name" class="sig-name" style="margin-top:{{ ! empty($client_signature ?? null) ? '0' : '22px' }};">{{ $client_name ?: 'INSERT NAME HERE' }}</div>
                    <div class="sig-role">Client</div>
                </td>
                <td style="text-align:center;">
                    @if (! empty($signer_signature))
                        <img src="{{ $signer_signature }}" alt="Signature" style="max-height:48px; max-width:160px; margin:0 auto 2px auto; display:block;">
                    @else
                        <div style="font-style:italic; font-size:8pt; color:#888; text-align:left;">Authorized signatory on behalf of the Company.</div>
                    @endif
                    <div class="sig-name" style="margin-top:{{ ! empty($signer_signature) ? '0' : '22px' }};">{{ $signer_name ?? 'Neil Bryan Escaner' }}</div>
                    <div class="sig-role">ePathways - Philippines</div>
                </td>
            </tr>
            <tr class="sig-meta-row">
                <td><strong>Date:</strong> ____________________________</td>
                <td><strong>Date:</strong> ____________________________</td>
            </tr>
            <tr class="sig-meta-row">
                <td><strong>Mobile:</strong> ____________________________</td>
                <td><strong>Mobile:</strong> {{ $signer_mobile ?? '+63945 107 6871' }} <em>[WhatsApp]</em></td>
            </tr>
        </tbody>
    </table>

    <div class="ack-box">
        <span id="ep-ack-mark">{!! ($acknowledged ?? false) ? '&#9745;' : '&#9744;' !!}</span>&nbsp;&nbsp; I have read and agreed to the English Engagement Agreement terms.
    </div>

    <div class="footer-rule">
        ePathways Philippines Consultancy &nbsp;|&nbsp; English Engagement Agreement
    </div>

    @if (($preview ?? false))
        {{-- Preview-only: mirror signature + ack toggle from the tracker
             sign modal via postMessage. Dompdf never sees this. --}}
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
                            if (sigName) sigName.style.marginTop = '22px';
                        }
                    } else if (d.type === 'acknowledged') {
                        if (ackMark) ackMark.innerHTML = d.value ? '&#9745;' : '&#9744;';
                    }
                });
            })();
        </script>
    @endif

</body>
</html>
