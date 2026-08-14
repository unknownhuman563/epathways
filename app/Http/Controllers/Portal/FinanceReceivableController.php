<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\FinancePayment;
use App\Models\FinanceReceivable;
use Illuminate\Http\Request;

/**
 * Accounts Receivable — invoices ePathways issues to clients, their payment
 * ledger, and the aging view. All figures are derived from the payment rows.
 */
class FinanceReceivableController extends Controller
{
    public function index(Request $request)
    {
        $status = $request->query('status');
        $q = trim((string) $request->query('q', ''));

        $rows = FinanceReceivable::with('payments')
            ->when($q !== '', fn ($query) => $query->where(fn ($w) => $w
                ->where('client_name', 'like', "%{$q}%")
                ->orWhere('invoice_no', 'like', "%{$q}%")
                ->orWhere('description', 'like', "%{$q}%")))
            ->orderByDesc('issue_date')->orderByDesc('id')
            ->get();

        // payment_status is derived, not a column — filter it in PHP.
        if ($status && $status !== 'all') {
            $rows = $rows->filter(fn ($r) => $r->payment_status === $status)->values();
        }

        $data = $rows->map(fn (FinanceReceivable $r) => [
            'id' => $r->id,
            'invoice_no' => $r->invoice_no,
            'client_name' => $r->client_name,
            'description' => $r->description,
            'currency' => $r->currency,
            'amount' => (float) $r->amount,
            'amount_paid' => $r->amount_paid,
            'balance' => $r->balance,
            'issue_date' => optional($r->issue_date)->toDateString(),
            'due_date' => optional($r->due_date)->toDateString(),
            'status' => $r->status,
            'payment_status' => $r->payment_status,
            'days_past_due' => $r->days_past_due,
            'aging_bucket' => $r->aging_bucket,
            'notes' => $r->notes,
            'payments' => $r->payments->map(fn ($p) => [
                'id' => $p->id,
                'amount' => (float) $p->amount,
                'paid_on' => optional($p->paid_on)->toDateString(),
                'method' => $p->method,
                'reference' => $p->reference,
                'notes' => $p->notes,
            ])->values(),
        ])->values();

        return inertia('portal/finance/Receivables', [
            'rows' => $data,
            'summary' => $this->summary($rows),
            'filters' => ['status' => $status ?: 'all', 'q' => $q],
            'currencyDefault' => strtoupper(config('services.booking.currency', 'nzd')),
        ]);
    }

    /** Outstanding total, overdue total, aging buckets, all-time collected. */
    private function summary($rows): array
    {
        $buckets = ['current' => 0, '1-30' => 0, '31-60' => 0, '61-90' => 0, '90+' => 0];
        $outstanding = 0;
        $overdue = 0;

        foreach ($rows as $r) {
            if (in_array($r->payment_status, ['paid', 'void'], true) || $r->balance <= 0.005) {
                continue;
            }
            $buckets[$r->aging_bucket] += $r->balance;
            $outstanding += $r->balance;
            if ($r->days_past_due > 0) {
                $overdue += $r->balance;
            }
        }

        return [
            'outstanding' => round($outstanding, 2),
            'overdue' => round($overdue, 2),
            'collected' => round((float) FinancePayment::where('paymentable_type', FinanceReceivable::class)->sum('amount'), 2),
            'buckets' => array_map(fn ($v) => round($v, 2), $buckets),
            'count' => $rows->count(),
        ];
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'invoice_no' => 'nullable|string|max:60|unique:finance_receivables,invoice_no',
            'client_name' => 'required|string|max:200',
            'description' => 'nullable|string|max:2000',
            'currency' => 'nullable|string|size:3',
            'amount' => 'required|numeric|min:0|max:99999999',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'status' => 'nullable|in:draft,sent',
            'notes' => 'nullable|string|max:2000',
        ]);

        $next = (FinanceReceivable::max('id') ?? 0) + 1;

        $r = FinanceReceivable::create([
            'invoice_no' => $data['invoice_no'] ?: 'AR-'.str_pad((string) $next, 5, '0', STR_PAD_LEFT),
            'client_name' => $data['client_name'],
            'description' => $data['description'] ?? null,
            'currency' => strtoupper($data['currency'] ?? config('services.booking.currency', 'nzd')),
            'amount' => $data['amount'],
            'issue_date' => $data['issue_date'],
            'due_date' => $data['due_date'],
            'status' => $data['status'] ?? 'draft',
            'notes' => $data['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', "Invoice {$r->invoice_no} created.");
    }

    public function update(Request $request, FinanceReceivable $receivable)
    {
        $data = $request->validate([
            'client_name' => 'required|string|max:200',
            'description' => 'nullable|string|max:2000',
            'currency' => 'nullable|string|size:3',
            'amount' => 'required|numeric|min:0|max:99999999',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'status' => 'nullable|in:draft,sent,paid,void',
            'notes' => 'nullable|string|max:2000',
        ]);

        $receivable->update([
            'client_name' => $data['client_name'],
            'description' => $data['description'] ?? null,
            'currency' => strtoupper($data['currency'] ?? $receivable->currency),
            'amount' => $data['amount'],
            'issue_date' => $data['issue_date'],
            'due_date' => $data['due_date'],
            'status' => $data['status'] ?? $receivable->status,
            'notes' => $data['notes'] ?? null,
        ]);

        return back()->with('success', "Invoice {$receivable->invoice_no} updated.");
    }

    public function destroy(FinanceReceivable $receivable)
    {
        $receivable->payments()->delete();
        $receivable->delete();

        return back()->with('success', 'Invoice deleted.');
    }

    public function recordPayment(Request $request, FinanceReceivable $receivable)
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:99999999',
            'paid_on' => 'required|date',
            'method' => 'nullable|string|max:60',
            'reference' => 'nullable|string|max:120',
            'notes' => 'nullable|string|max:500',
        ]);

        $receivable->payments()->create([
            'amount' => $data['amount'],
            'paid_on' => $data['paid_on'],
            'method' => $data['method'] ?? null,
            'reference' => $data['reference'] ?? null,
            'notes' => $data['notes'] ?? null,
            'recorded_by' => auth()->id(),
        ]);

        // A payment implies the invoice was issued; settle it when fully paid.
        $receivable->refresh();
        if ($receivable->status !== 'void' && $receivable->balance <= 0.005) {
            $receivable->update(['status' => 'paid']);
        } elseif ($receivable->status === 'draft') {
            $receivable->update(['status' => 'sent']);
        }

        return back()->with('success', 'Payment recorded.');
    }

    public function deletePayment(FinanceReceivable $receivable, FinancePayment $payment)
    {
        abort_unless(
            $payment->paymentable_id === $receivable->id && $payment->paymentable_type === FinanceReceivable::class,
            404
        );

        $payment->delete();

        $receivable->refresh();
        if ($receivable->status === 'paid' && $receivable->balance > 0.005) {
            $receivable->update(['status' => 'sent']);
        }

        return back()->with('success', 'Payment removed.');
    }
}
