{{-- Public 503 shown when a super-admin has taken the application tracker
     offline (independent of full maintenance mode). Self-contained so it
     renders even mid-deploy. --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Tracker temporarily unavailable — ePathways</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        body {
            margin: 0; min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            padding: 24px; background: #f8fafc; color: #0f172a;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
            line-height: 1.6;
        }
        .card {
            width: 100%; max-width: 520px; background: #fff;
            border: 1px solid #e2e8f0; border-radius: 16px; padding: 40px;
            text-align: center; box-shadow: 0 10px 30px rgba(15, 23, 42, .06);
        }
        .badge {
            display: inline-flex; align-items: center; gap: 8px;
            padding: 6px 14px; border-radius: 999px;
            background: #ecfdf5; color: #047857; border: 1px solid #d1fae5;
            font-size: 12px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
        .brand { margin: 24px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -.02em; }
        h1 { margin: 12px 0 0; font-size: 25px; font-weight: 700; letter-spacing: -.02em; }
        p.msg { margin: 14px 0 0; color: #475569; font-size: 16px; }
        .contact { margin-top: 26px; font-size: 14px; color: #64748b; }
        .contact a { color: #0f172a; font-weight: 600; text-decoration: none; }
        .contact a:hover { text-decoration: underline; }
        @media (prefers-color-scheme: dark) {
            body { background: #0b1120; color: #e2e8f0; }
            .card { background: #111827; border-color: #1f2937; box-shadow: none; }
            .badge { background: #052e21; color: #6ee7b7; border-color: #064e3b; }
            p.msg { color: #94a3b8; }
            .contact { color: #94a3b8; }
            .contact a { color: #f1f5f9; }
        }
    </style>
</head>
<body>
    <main class="card">
        <span class="badge"><span class="dot"></span> Application Tracker</span>
        <p class="brand">ePathways.</p>
        <h1>Temporarily unavailable</h1>
        <p class="msg">
            The application tracker is briefly offline for maintenance. Your documents and progress
            are safe — please check back shortly.
        </p>
        @if (config('services.contact.email'))
            <p class="contact">
                Need something in the meantime?
                <a href="mailto:{{ config('services.contact.email') }}">{{ config('services.contact.email') }}</a>
            </p>
        @endif
    </main>
</body>
</html>
