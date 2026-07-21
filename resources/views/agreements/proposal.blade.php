{{--
    Study Proposal — a lightweight placeholder rendered per-lead. Bryll can
    replace the section bodies with the real proposal content later; this
    file just gives the generator + docs tab something to render on day one.

    Vars expected:
        $client_name             — lead's full name
        $client_reference        — slugified name for filenames / references
        $preferred_course        — from Lead::preferred_course (may be null)
        $preferred_intake        — from Lead::preferred_intake (may be null)
        $preferred_city_of_study — from Lead::preferred_city_of_study (may be null)
        $target_institution      — from Lead::target_institution (may be null)
        $generated_at_formatted  — "26th day of May 2026"
--}}
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Study Proposal — {{ $client_name }}</title>
<style>
    @font-face { font-family: 'Urbanist'; font-style: normal; font-weight: 400; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Regular.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: italic; font-weight: 400; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Italic.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: normal; font-weight: 700; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-Bold.ttf") }}') format('truetype'); }
    @font-face { font-family: 'Urbanist'; font-style: italic; font-weight: 700; src: url('{{ base_path("resources/fonts/urbanist/Urbanist-BoldItalic.ttf") }}') format('truetype'); }

    @page { margin: 120px 60px 70px 60px; }
    body { font-family: 'Urbanist', DejaVu Sans, sans-serif; font-size: 12pt; color: #111; line-height: 1.55; }
    .page-header { position: fixed; top: -80px; left: 0; right: 0; text-align: center; }
    .page-header img { height: 60px; width: auto; }
    .eyebrow { text-align: center; color: #436235; font-weight: bold; font-size: 9pt; letter-spacing: 2px; margin-bottom: 6px; }
    h1 { text-align: center; font-size: 22pt; font-weight: 900; letter-spacing: 1px; margin: 0 0 4px 0; color: #1a1a1a; }
    .subtitle { text-align: center; color: #555; font-size: 10pt; font-style: italic; margin-bottom: 18px; }
    hr { border: 0; border-top: 1.5px solid #436235; margin: 14px 0; }
    .article-bar { text-align: center; font-weight: bold; color: #436235; font-size: 11pt; letter-spacing: 1.2px; padding: 4px 0; border-top: 1.5px solid #436235; border-bottom: 1.5px solid #436235; margin: 22px 0 14px 0; }
    h3 { color: #436235; font-size: 11pt; margin-top: 16px; margin-bottom: 6px; }
    p { margin: 8px 0; text-align: justify; }
    .snapshot { border: 1px solid #d8d8d8; padding: 12px 16px; margin: 14px 0; }
    .snapshot .row { padding: 3px 0; font-size: 10pt; }
    .snapshot .label { display: inline-block; width: 180px; color: #555; }
    .footer-note { font-size: 9pt; color: #666; margin-top: 22px; text-align: center; font-style: italic; }
</style>
</head>
<body>

<div class="page-header">
    <img src="{{ base_path('resources/assets/philipine_ep_logo.png') }}" alt="ePathways Philippines">
</div>

<div class="eyebrow">ePathways · Study Proposal</div>
<h1>STUDY PROPOSAL</h1>
<div class="subtitle">Prepared for {{ $client_name }}</div>
<hr>

<p>Dear {{ $client_name }},</p>

<p>
    Thank you for considering ePathways for your study journey to New Zealand.
    Based on our discussion, we've prepared the following proposal outlining
    the recommended pathway, expected timeline, and next steps.
</p>

<div class="snapshot">
    <div class="row"><span class="label">Preferred Course:</span> {{ $preferred_course ?: '—' }}</div>
    <div class="row"><span class="label">Preferred Intake:</span> {{ $preferred_intake ?: '—' }}</div>
    <div class="row"><span class="label">Preferred City of Study:</span> {{ $preferred_city_of_study ?: '—' }}</div>
    <div class="row"><span class="label">Target Institution:</span> {{ $target_institution ?: 'To be discussed' }}</div>
</div>

<div class="article-bar">RECOMMENDED PATHWAY</div>
<p>
    Your adviser will detail the recommended programme, entry requirements,
    English language requirements, and study duration during the next
    consultation session. This proposal will be updated once the specific
    institution has been endorsed.
</p>

<div class="article-bar">ESTIMATED COSTS</div>
<p>
    A detailed cost breakdown — tuition, living expenses, visa fees, and
    insurance — will follow once the target institution is confirmed. All
    quoted amounts will be in NZD unless otherwise stated.
</p>

<div class="article-bar">NEXT STEPS</div>
<ol>
    <li>Confirm your preferred programme and intake with your adviser.</li>
    <li>Sign the Consultancy Agreement so we can lodge your application.</li>
    <li>Begin collecting the checklist documents on your tracker link.</li>
    <li>Attend the pre-departure briefing once your visa is approved.</li>
</ol>

<p class="footer-note">
    Generated on {{ $generated_at_formatted }}. This proposal is indicative
    and does not constitute a binding offer.
</p>

</body>
</html>
