<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Invoice {{ $invoiceNo }} — {{ $billTo }}</title>
    <style>
        @page { margin: 44px 40px 46px 40px; }
        * { box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', sans-serif; color: #22303f; font-size: 10px; line-height: 1.45; margin: 0; }
        body.word { padding: 22px 26px; }
        body.web { background: #e9edf2; padding: 20px 0; }
        body.web .sheet { width: 210mm; min-height: 296mm; margin: 0 auto; background: #fff; padding: 16mm 15mm; box-shadow: 0 3px 16px rgba(15,23,42,.18); }

        .head { border-bottom: 2px solid #1F4E79; padding-bottom: 8px; margin-bottom: 16px; }
        .brand { font-size: 18px; font-weight: bold; color: #1F4E79; }
        .brand .dot { color: #2E74B5; }
        .sub { font-size: 8px; color: #8a97a5; }
        .doctype { font-size: 22px; font-weight: bold; color: #1F4E79; text-align: right; }

        table { width: 100%; border-collapse: collapse; }
        .meta td { vertical-align: top; padding: 0; }
        .meta .label { font-size: 7.5px; text-transform: uppercase; letter-spacing: .5px; color: #8a97a5; }
        .meta .val { font-size: 10px; color: #22303f; margin-bottom: 6px; }

        .lines { margin-top: 18px; }
        .lines th { text-align: left; font-size: 7.5px; text-transform: uppercase; letter-spacing: .5px; color: #8a97a5; border-bottom: 1px solid #d7dee6; padding: 6px 4px; }
        .lines th.num, .lines td.num { text-align: right; }
        .lines td { padding: 8px 4px; border-bottom: 1px solid #eef2f6; }

        .totals { margin-top: 10px; width: 46%; margin-left: 54%; }
        .totals td { padding: 4px 4px; font-size: 10px; }
        .totals td.num { text-align: right; }
        .totals .grand td { border-top: 2px solid #1F4E79; font-weight: bold; font-size: 12px; color: #1F4E79; }
        .totals .owed td { color: #b45309; font-weight: bold; }
        .totals .paid td { color: #047857; }

        .ledger { margin-top: 22px; }
        .ledger h3 { font-size: 9px; text-transform: uppercase; letter-spacing: .5px; color: #1F4E79; margin: 0 0 6px; }
        .ledger th { text-align: left; font-size: 7.5px; text-transform: uppercase; color: #8a97a5; border-bottom: 1px solid #d7dee6; padding: 5px 4px; }
        .ledger td { padding: 6px 4px; border-bottom: 1px solid #eef2f6; font-size: 9px; }
        .ledger td.num { text-align: right; }

        .note { margin-top: 18px; font-size: 9px; color: #4b5966; }
        .foot { margin-top: 26px; font-size: 8px; color: #9aa6b2; text-align: center; border-top: 1px solid #e5ebf1; padding-top: 8px; }
        .pill { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; }
        .pill.settled { background: #dcfce7; color: #166534; }
        .pill.outstanding { background: #fef3c7; color: #92400e; }
    </style>
</head>
<body class="{{ $mode === 'web' ? 'web' : ($mode === 'word' ? 'word' : 'pdf') }}">
@php $wrap = $mode === 'web'; @endphp
@if($wrap)<div class="sheet">@endif

    <div class="head">
        <table>
            <tr>
                <td>
                    <div class="brand">ePathways<span class="dot">.</span></div>
                    <div class="sub">Education &amp; Immigration Consultancy · New Zealand</div>
                    @if($issuedFrom)<div class="sub">Issued from: {{ $issuedFrom }}</div>@endif
                </td>
                <td style="text-align:right;">
                    <div class="doctype">INVOICE</div>
                    <div class="sub">{{ $invoiceNo }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table class="meta">
        <tr>
            <td style="width:50%;">
                <div class="label">Bill to</div>
                <div class="val">{{ $billTo }}</div>
                @if($caseRef)<div class="label">Case reference</div><div class="val">{{ $caseRef }}</div>@endif
            </td>
            <td style="width:50%;">
                <div class="label">Invoice date</div>
                <div class="val">{{ $invoiceDate }}</div>
                <div class="label">Currency</div>
                <div class="val">{{ $currency }}</div>
                <div class="label">Status</div>
                <div class="val"><span class="pill {{ $settled ? 'settled' : 'outstanding' }}">{{ $settled ? 'Settled' : 'Outstanding' }}</span></div>
            </td>
        </tr>
    </table>

    <table class="lines">
        <thead><tr><th>Description</th><th class="num">Amount ({{ $currency }})</th></tr></thead>
        <tbody>
            @forelse($lines as $line)
                <tr><td>{{ $line['label'] }}</td><td class="num">{{ number_format($line['amount'], 2) }}</td></tr>
            @empty
                <tr><td colspan="2" style="color:#9aa6b2;">No fees recorded on this case yet.</td></tr>
            @endforelse
        </tbody>
    </table>

    <table class="totals">
        <tr><td>Total payable</td><td class="num">{{ number_format($totalPayable, 2) }}</td></tr>
        <tr class="paid"><td>Paid to date</td><td class="num">{{ number_format($totalPaid, 2) }}</td></tr>
        <tr class="grand owed"><td>Balance owed</td><td class="num">{{ number_format($owed, 2) }}</td></tr>
    </table>

    @if(count($payments))
    <div class="ledger">
        <h3>Payment ledger</h3>
        <table>
            <thead><tr><th>Date</th><th>Method</th><th>Reference</th><th class="num">Amount ({{ $currency }})</th></tr></thead>
            <tbody>
                @foreach($payments as $p)
                    <tr><td>{{ $p['paid_at'] ?? '—' }}</td><td>{{ $p['method'] ?? '—' }}</td><td>{{ $p['reference'] ?? '—' }}</td><td class="num">{{ number_format($p['amount'], 2) }}</td></tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if($notes)<div class="note"><strong>Notes:</strong> {{ $notes }}</div>@endif
    @if($disbursement > 0)<div class="note">Includes a pass-through disbursement of {{ $currency }} {{ number_format($disbursement, 2) }} (INZ application fee).</div>@endif

    <div class="foot">Invoice {{ $invoiceNo }} · Generated {{ $generatedAt }} · ePathways</div>

@if($wrap)</div>@endif
</body>
</html>
