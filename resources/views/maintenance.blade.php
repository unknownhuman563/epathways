{{-- Public 503 maintenance page. Deliberately self-contained (no @vite, no
     external fonts) so it still renders correctly mid-deploy when the asset
     build may be incomplete. --}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>Back soon — ePathways</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            background: #f8fafc;
            color: #0f172a;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
            line-height: 1.6;
        }
        .card {
            width: 100%;
            max-width: 560px;
            background: #fff;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(15, 23, 42, .06);
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            background: #f1f5f9;
            color: #475569;
            font-size: 13px;
            font-weight: 600;
            letter-spacing: .01em;
        }
        .dot {
            width: 8px; height: 8px;
            border-radius: 50%;
            background: #f59e0b;
        }
        .brand { margin: 24px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -.02em; }
        h1 { margin: 12px 0 0; font-size: 27px; font-weight: 700; letter-spacing: -.02em; }
        p.msg { margin: 14px 0 0; color: #475569; font-size: 16px; }
        .eta {
            margin-top: 26px;
            padding: 14px 18px;
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            background: #f8fafc;
            font-size: 14px;
            color: #334155;
        }
        .eta strong { color: #0f172a; }
        .contact { margin-top: 26px; font-size: 14px; color: #64748b; }
        .contact a { color: #0f172a; font-weight: 600; text-decoration: none; }
        .contact a:hover { text-decoration: underline; }
        @media (prefers-color-scheme: dark) {
            body { background: #0b1120; color: #e2e8f0; }
            .card { background: #111827; border-color: #1f2937; box-shadow: none; }
            .badge { background: #1f2937; color: #cbd5e1; }
            p.msg { color: #94a3b8; }
            .eta { background: #0b1120; border-color: #1f2937; color: #cbd5e1; }
            .eta strong { color: #f1f5f9; }
            .contact { color: #94a3b8; }
            .contact a { color: #f1f5f9; }
        }
    </style>
</head>
<body>
    <main class="card">
        <span class="badge"><span class="dot"></span> Scheduled maintenance</span>

        <p class="brand">ePathways.</p>
        <h1>We'll be back shortly</h1>

        <p class="msg">{{ $message }}</p>

        @if (! empty($eta))
            <div class="eta">
                Expected back by <strong>{{ $eta->timezone('Pacific/Auckland')->format('g:ia, D j M') }}</strong> (NZ time)
            </div>
        @endif

        @if (config('services.contact.email'))
            <p class="contact">
                Need us urgently?
                <a href="mailto:{{ config('services.contact.email') }}">{{ config('services.contact.email') }}</a>
            </p>
        @endif
    </main>
</body>
</html>
