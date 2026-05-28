{{--
    Consultancy Agreement template — single OR partner variant.
    Rendered to PDF by AgreementGenerator using barryvdh/laravel-dompdf.
    Mirrors the layout of the Word-docx originals at
    Standard_Consultancy_Agreement_{Single,Partner}.docx.

    Vars expected:
        $variant     ('single' | 'partner')
        $title       (display title — "CONSULTANCY AGREEMENT" or "ENGAGEMENT AGREEMENT")
        $client_name (lead's full name)
        $fee_label   ("PhP 100,000.00" / "PhP 150,000.00")
        $stage_label ("School Enrollment [Single Applicant]" etc.)
        $generated_at (Carbon)
--}}
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{{ $title }}</title>
<style>
    @page { margin: 70px 60px 70px 60px; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 11pt; color: #111; line-height: 1.5; }
    .brand { text-align: center; margin-bottom: 4px; }
    .brand-name { color: #436235; font-weight: bold; font-size: 18pt; letter-spacing: 0.3px; }
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
    table.fees tbody td { padding: 8px 10px; border-bottom: 1px solid #d8d8d8; font-size: 10pt; }
    table.fees tbody td.right { text-align: right; font-weight: bold; }
    .note-italic { font-style: italic; font-size: 9pt; color: #555; margin: 6px 0 12px 0; }
    .bank-box { border: 1px solid #436235; padding: 10px 14px; margin: 8px 0 16px 0; }
    .bank-box .row { padding: 2px 0; font-size: 10pt; }
    .bank-box .label { display: inline-block; width: 130px; color: #555; }
    .bank-box .heading { color: #436235; font-weight: bold; margin-bottom: 6px; }
    ul { margin: 6px 0 10px 18px; padding: 0; }
    ul li { margin: 4px 0; font-size: 10pt; }
    .strong { font-weight: bold; }
    .signature-table { width: 100%; border-collapse: collapse; margin-top: 22px; }
    .signature-table th { background: #436235; color: #fff; text-align: center; padding: 6px; font-size: 10pt; }
    .signature-table td { border: 1px solid #436235; padding: 12px; vertical-align: top; height: 70px; font-size: 10pt; width: 50%; }
    .sig-name { font-weight: bold; text-align: center; margin-top: 22px; }
    .sig-role { text-align: center; font-style: italic; color: #555; font-size: 9pt; }
    .sig-meta-row td { padding: 6px 12px; height: auto; }
    .ack-box { border: 1px solid #436235; padding: 8px 12px; margin-top: 14px; font-weight: bold; font-size: 10pt; }
    .placeholder { color: #436235; font-weight: bold; }
    .footer-rule { border-top: 1px solid #d8d8d8; margin-top: 24px; padding-top: 6px; font-size: 8pt; color: #888; text-align: center; }
    .insert-name { color: #436235; font-weight: bold; }
</style>
</head>
<body>

    <div class="eyebrow">OFFICIAL DOCUMENT &nbsp;•&nbsp; CONFIDENTIAL</div>
    <h1>{{ $title }}</h1>
    <div class="subtitle">Educational Pathway &amp; Visa Consultation Services</div>
    <hr>

    <p>This Engagement Agreement (&ldquo;Agreement&rdquo;) delineates the terms and conditions governing the provision of services by <strong>Epathways Philippines Consultancy</strong> (&ldquo;Company&rdquo;) <span class="insert-name">{{ $client_name ?: 'INSERT NAME HERE' }}</span> (&ldquo;you&rdquo;), pertaining to your educational, visa process through our Licensed Immigration Adviser Partner in New Zealand. It is imperative that you thoroughly scrutinize the ensuing terms and signify your acceptance by executing and furnishing a copy of this Agreement.</p>

    <div class="article-bar">ARTICLE I &nbsp;•&nbsp; FEES STRUCTURE &amp; PAYMENT PLAN</div>

    <p><strong>Section 1.</strong> The fees associated with our enrollment processing, Documentation and Licensed Immigration Adviser consultation services and comprehensive assistance encompassing the compilation and review of all requisite documentation:</p>

    <table class="fees">
        <thead>
            <tr>
                <th>Stage / Description</th>
                <th class="right">Amount [PhP]</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Initial Stage Assessment &amp; Goal Setting meeting</td>
                <td class="right">FREE</td>
            </tr>
            <tr>
                <td>{{ $stage_label }}</td>
                <td class="right">{{ $fee_label }}</td>
            </tr>
        </tbody>
    </table>

    <p class="note-italic">The price quoted is indicative only and subject to change without prior notice in the event of regulatory, institutional, policy changes or other factors beyond our control.</p>

    <p>It is imperative to explicitly acknowledge and adhere to the understanding that the fees rendered for our services become <strong>non-refundable</strong> once work has commenced at each stage.</p>

    <p>This acknowledgment is rooted in the established legal principle that recognizes the commitment of resources and efforts undertaken by the Company upon initiation of work, thereby precluding any possibility of refund.</p>

    <h3>Section 3. Our Bank Account Details</h3>
    <div class="bank-box">
        <div class="heading">Payment for School Enrollment and Documentation Fee</div>
        <div class="row"><span class="label">Bank Name:</span> <strong>RCBC</strong></div>
        <div class="row"><span class="label">Account Name:</span> <strong>Dinah Suarin</strong></div>
        <div class="row"><span class="label">Account Number:</span> <strong>9045440503</strong></div>
        <div class="row"><span class="label">Reference:</span> <strong>#{{ $client_reference }}</strong></div>
    </div>

    <div class="article-bar">ARTICLE II &nbsp;•&nbsp; SCOPE OF SERVICES</div>

    <h3>Section 1. Evaluation and Assessment</h3>
    <p>During this phase, the Company shall undertake the collection of necessary documentation, which encompasses your Passport, Curriculum Vitae (CV), Graduate Certificate, and Transcript of Records (TOR), utilizing our designated online submission form. It is imperative to emphasize that the aforementioned documents serve as critical prerequisites for the facilitation of the services outlined within this Agreement. The utilization of our online platform ensures the secure transmission and handling of sensitive information in compliance with prevailing data protection regulations.</p>

    <h3>Section 2. Goal Setting Meeting</h3>
    <p>The Company will perform a thorough evaluation of your documentation, followed by a goal-setting session to deliberate on diverse options tailored to your individual circumstances. These considerations encompass, but are not limited to, essential criteria such as educational prerequisites, financial viability, sponsorship availability, and temporal constraints. Subsequent to your endorsement of the proposed course of action, progression to Stage 3 shall ensue.</p>

    <h3>Section 3. School Application Enrollment</h3>
    <p><strong>3.1 Securing your Offer of Place</strong></p>
    <p>The Company shall furnish you with a comprehensive checklist delineating the prerequisites for securing an Offer of Place from your selected educational institution. We shall serve as intermediaries in communication with the respective schools, facilitating the compilation and submission of all requisite documentation on your behalf.</p>
    <ul>
        <li>We will assist you in filling out and submitting the school application form, along with necessary documents</li>
        <li>Submit all required documents (transcripts, English proficiency, passport, CV, and other)</li>
        <li>Assist you in drafting letter of Intent / Statement of Purpose</li>
        <li>Arrange for schedule of entrance exams and interviews with the institution</li>
        <li>Provide preparation guidance for the exam and interview process</li>
        <li>Receive and confirm the Offer Of Place from the institution to secure your spot.</li>
    </ul>

    <p><strong>3.2 English Proficiency Test</strong></p>
    <p>Support and assisting in the prerequisite English Proficiency Test. The Company offers an in-house one-on-one online review (at least 30 hours) to help you prepare for the English Proficiency test (IELTS or PTE). This personalized support ensures that you are well prepared and confident in passing your exam.</p>
    <ul>
        <li>We shall arrange a formal meeting with an assigned dedicated English Personal Tutor, who will meticulously devise a personalized review schedule spanning a duration of at least 20 hours, customized to your specific requirements and objectives.</li>
        <li>We will also assist you in booking your exam to the closest testing center where you live or where you would like to take the exam.</li>
    </ul>
    <p>We commit to providing you with consistent and timely updates, typically on a weekly, fortnightly or as required basis, to ensure you are informed of the progress and developments throughout the duration of our engagement.</p>
    <p>You clearly understand that ePathways Philippines is <strong>not responsible to giving you work in New Zealand</strong>. We are <strong>ONLY</strong> advising and assisting you on the best education pathway that fits your goal.</p>

    <h3>Section 4. Visa Processing</h3>
    <p><strong>4.1 Endorsement to Licence Immigration Adviser</strong></p>
    <p>Upon the successful conclusion of Section (Stage) 3, the Company shall facilitate your transition to our NZ Professional Licensed Immigration Adviser Team for the processing of your visa application. The License Immigration Adviser will send you a separate engagement agreement to comply with Immigration New Zealand Law. It is imperative to note that all associated costs pertaining to your visa processing shall be exclusively borne by you and is not included in our consultation fee.</p>
    <ul>
        <li>We will schedule a meeting with the LIA if necessary to review the visa requirements and guide you through each step to ensure your application is fully prepared.</li>
        <li>Assist you in compiling your bank statements or financial records as required by the Licensed Immigration Adviser to show sufficient funds to cover tuition and living expenses in New Zealand</li>
        <li>Helping you in drafting your compelling and clear Statement of Purpose</li>
        <li>Verifying all required documents as per the checklist from the LIA</li>
        <li>Ensuring all documents are properly organized, labelled and ready for submission</li>
        <li>Making sure you&rsquo;re aware of any additional documents or forms that may be specific to your visa application type, such as medical or police checks</li>
    </ul>

    <p><strong>4.1 Visa Lodgement</strong></p>
    <p>When your documentation is ready, the Licensed Immigration Adviser will lodge your visa application for both you and your partner (If applicable). This includes the submission, processing and follow up.</p>
    <ul>
        <li>Documents will be reviewed, checked and the visa application submitted by the LIA.</li>
        <li>We will monitor the progress of your application, ensuring timely updates and addressing any issues promptly</li>
        <li>The LIA will liaise with New Zealand Immigration to resolve any queries and ensure all required documentation is provided if needed</li>
        <li>We will keep you informed on the status of your visa, which typically takes 4-6 weeks to process, and notify you once a decision is made.</li>
    </ul>

    <h3>Section 5. Visa Outcome &amp; Settlement in NZ</h3>
    <p>Upon receipt of the decision outcome of your visa application, the Company shall expeditiously communicate the result to you.</p>

    <h3>Section 6. Settlement in New Zealand</h3>
    <p>ePathways - Philippines will facilitate your settlement in New Zealand. ePathways Management - Philippines will orchestrate various arrangements including flight bookings, airport transfers, and accommodation procurement, tailored to your specific requirements, whether for shared or single occupancy accommodations. This service may incur additional costs.</p>

    <div class="article-bar">ARTICLE III &nbsp;•&nbsp; DISBURSEMENT / OTHER DIRECT EXPENSES</div>
    <p>It is important to note that throughout the course of this process, there may arise sundry additional expenditures, commonly referred to as disbursements, which encompass, albeit are not confined to, medical expenses, visa application fees, and incidental travel-related costs. It is imperative to underscore that these ancillary costs are not encompassed within the ambit of our prescribed fees, thus necessitating your direct assumption of responsibility for their settlement.</p>

    <div class="article-bar">ARTICLE IV &nbsp;•&nbsp; TERMINATION</div>
    <p>Either party reserves the right to unilaterally terminate this Agreement, with due regard to legal protocol, by issuing a written notification to the counterparty. Such termination shall be deemed effective upon the delivery of said written notice, thereby aligning with the fundamental principles of entering contracts at will and the right to terminate engagements.</p>

    <div class="article-bar">ARTICLE V &nbsp;•&nbsp; GOVERNING LAW</div>
    <p>This Agreement shall be subject to and interpreted in accordance with the laws prevailing in your country. Such governance ensures adherence to the legal framework of the jurisdiction in which this Agreement is enforced, thereby fostering clarity and consistency in contractual interpretation and implementation.</p>

    <div class="article-bar">ARTICLE 6 &nbsp;•&nbsp; DATA PRIVACY</div>
    <p><strong>Section 1.</strong> The Company shall comply with the requirements under the Data Privacy Act of 2012, and such rules, orders, and regulations as may be issued by the National Privacy Commission (&ldquo;NPC&rdquo;) in relation to the processing and possession of Personal Information and/or Sensitive Personal Information.</p>
    <p>&ldquo;Data&rdquo; means the contract files, materials and other information in physical, electronic or any other form pertaining to the Services. Data shall include All Personal Information and Sensitive Personal Information as defined in the Data Privacy Act of 2012.</p>
    <p><strong>Section 2.</strong> The Company shall ensure that only authorized personnel shall process or have access to the Data. Confidentiality obligations shall be imposed to such personnel evidenced by a written confidentiality agreement.</p>
    <p><strong>Section 3.</strong> The Company shall be responsible for the custody and safekeeping of the Data, immediately from the effectivity of this Agreement.</p>

    <p>Should you concur with the terms delineated herein and elect to avail yourself of our services, kindly affix your signature and promptly return a duplicate of this Agreement to signify your acceptance thereof.</p>

    <hr>

    <p><strong>IN WITNESS WHEREOF</strong>, both parties have hereunto set their hands this <span class="strong" style="text-decoration: underline">{{ $generated_at_formatted }}</span>.</p>

    <table class="signature-table">
        <thead>
            <tr><th>CLIENT</th><th>COMPANY</th></tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div style="font-style:italic; font-size:8pt; color:#888;">Insert your e-signature above, or place a check mark (✓) below if unavailable.</div>
                    <div class="sig-name">{{ $client_name ?: 'INSERT NAME HERE' }}</div>
                    <div class="sig-role">Client</div>
                </td>
                <td>
                    <div style="font-style:italic; font-size:8pt; color:#888;">Authorized signatory on behalf of the Company.</div>
                    <div class="sig-name">Neil Bryan Escaner</div>
                    <div class="sig-role">ePathways - Philippines</div>
                </td>
            </tr>
            <tr class="sig-meta-row">
                <td><strong>Date:</strong> ____________________________</td>
                <td><strong>Date:</strong> ____________________________</td>
            </tr>
            <tr class="sig-meta-row">
                <td><strong>Mobile:</strong> ____________________________</td>
                <td><strong>Mobile:</strong> +63945 107 6871 <em>[WhatsApp]</em></td>
            </tr>
        </tbody>
    </table>

    <div class="ack-box">
        &#9744; &nbsp;&nbsp; I have read and agreed to the Consultancy Agreement terms.
    </div>

    <div class="footer-rule">
        ePathways Philippines Consultancy &nbsp;|&nbsp; Engagement Agreement &nbsp;|&nbsp; Variant: {{ ucfirst($variant) }}
    </div>

</body>
</html>
