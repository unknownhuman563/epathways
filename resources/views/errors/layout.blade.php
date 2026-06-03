<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@yield('code', 'Error') — ePathways</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --teal:   #00A693;
            --dark:   #282728;
            --muted:  #6b7280;
            --bg:     #f8f9fb;
        }
        * { box-sizing: border-box; }
        html, body { height: 100%; }
        body {
            margin: 0;
            font-family: 'Urbanist', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(180deg, #ffffff 0%, var(--bg) 100%);
            color: var(--dark);
            -webkit-font-smoothing: antialiased;
        }
        .shell {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        header.brand {
            padding: 24px 32px;
        }
        header.brand a {
            font-weight: 900;
            font-size: 22px;
            color: var(--dark);
            text-decoration: none;
            letter-spacing: -0.02em;
        }
        header.brand a span { color: var(--teal); }
        main {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
        }
        .card {
            max-width: 540px;
            width: 100%;
            text-align: center;
            padding: 8px 16px 56px;
        }
        .badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.35em;
            text-transform: uppercase;
            color: var(--teal);
            background: rgba(0, 166, 147, 0.08);
            padding: 8px 14px;
            border-radius: 999px;
            margin-bottom: 28px;
        }
        .code {
            font-size: clamp(96px, 22vw, 180px);
            font-weight: 900;
            line-height: 0.9;
            letter-spacing: -0.05em;
            background: linear-gradient(135deg, var(--dark) 0%, var(--teal) 100%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            margin: 0 0 12px;
        }
        h1 {
            font-size: clamp(20px, 3vw, 28px);
            font-weight: 800;
            letter-spacing: -0.01em;
            margin: 0 0 16px;
        }
        p {
            color: var(--muted);
            font-size: 15px;
            line-height: 1.65;
            margin: 0 auto 32px;
            max-width: 420px;
        }
        .actions {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
        }
        a.btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 24px;
            border-radius: 14px;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            text-decoration: none;
            transition: transform 120ms ease, background 120ms ease;
        }
        a.btn.primary {
            background: var(--dark);
            color: #fff;
        }
        a.btn.primary:hover { background: var(--teal); }
        a.btn.secondary {
            background: #fff;
            color: var(--dark);
            border: 1px solid #e5e7eb;
        }
        a.btn.secondary:hover { border-color: var(--dark); }
        a.btn:active { transform: scale(0.98); }
        footer {
            padding: 24px 32px;
            font-size: 11px;
            color: var(--muted);
            text-align: center;
            letter-spacing: 0.04em;
        }
        footer a { color: var(--muted); text-decoration: none; }
        footer a:hover { color: var(--dark); }
    </style>
</head>
<body>
<div class="shell">
    <header class="brand">
        <a href="/">epathways<span>.</span></a>
    </header>
    <main>
        <div class="card">
            <div class="badge">@yield('eyebrow', 'Something went wrong')</div>
            <p class="code">@yield('code', '500')</p>
            <h1>@yield('title', 'Something went wrong')</h1>
            <p>@yield('message', 'An unexpected error occurred. Please try again or reach out if the problem persists.')</p>
            <div class="actions">
                <a href="/" class="btn primary">Back to home</a>
                <a href="mailto:{{ config('services.contact.email', 'info@epathways.co.nz') }}" class="btn secondary">Contact us</a>
            </div>
        </div>
    </main>
    <footer>
        © {{ date('Y') }} ePathways — Education &amp; Immigration Consultancy
    </footer>
</div>
</body>
</html>
