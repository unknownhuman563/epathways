<!DOCTYPE html>
<html lang="en">

<head>
    <link rel="icon" type="image/png" href="{{ asset('favicon.png') }}">

    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>ePathways</title>

    {{--
        Central, server-rendered SEO defaults. The canonical URL is built from
        the fixed canonical base (config('app.canonical_url')) + the request
        path, so every public page advertises https://luvep.com/... regardless
        of the request host. Per-page <title> is overridden client-side via
        Inertia's <Head>. Query strings are dropped from the canonical to avoid
        duplicate-URL signals.
    --}}
    @php
        $canonicalBase = rtrim(config('app.canonical_url'), '/');
        $canonicalPath = trim(request()->path(), '/');
        $canonicalUrl = $canonicalBase.($canonicalPath === '' ? '/' : '/'.$canonicalPath);
        $defaultDescription = 'ePathways — New Zealand education and immigration consultancy. Study pathways, visa assessments, licensed immigration advice and student accommodation support.';
        $ogImage = $canonicalBase.'/favicon.png';
    @endphp
    <link rel="canonical" href="{{ $canonicalUrl }}">
    <meta name="description" content="{{ $defaultDescription }}">

    <meta property="og:type" content="website">
    <meta property="og:site_name" content="ePathways">
    <meta property="og:title" content="ePathways — Education & Immigration NZ">
    <meta property="og:description" content="{{ $defaultDescription }}">
    <meta property="og:url" content="{{ $canonicalUrl }}">
    <meta property="og:image" content="{{ $ogImage }}">

    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="ePathways — Education & Immigration NZ">
    <meta name="twitter:description" content="{{ $defaultDescription }}">
    <meta name="twitter:image" content="{{ $ogImage }}">

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">

    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
</head>

<body>
    @inertia
</body>

</html>