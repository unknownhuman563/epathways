<?php

namespace Tests\Feature\Immigration;

use App\Models\CaseFinancePayment;
use App\Models\CaseFinancial;
use App\Models\Lead;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Per-case financials — fees + invoice + payment ledger, with total payable /
 * paid / owed / settled derived from human-entered figures (no generated
 * numbers). Replaces the spreadsheet money columns.
 */
class CaseFinancialsTest extends TestCase
{
    use RefreshDatabase;

    private function caseLead(): Lead
    {
        return Lead::create([
            'first_name' => 'Aroha', 'last_name' => 'Ngata', 'email' => 'aroha@example.test',
            'is_immigration_case' => true, 'inz_visa_type' => 'Student Visa',
        ]);
    }

    private function staff(): User
    {
        return User::factory()->create(['role' => 'immigration']);
    }

    public function test_saving_fees_records_referral_and_derives_total_payable(): void
    {
        $case = $this->caseLead();

        $this->actingAs($this->staff())
            ->post("/portal/immigration/cases/{$case->id}/financials", [
                'service_fee_chargeable' => 1500,
                'inz_fee' => 850,
                'payment_type' => 'pay_later',
                'invoice_no' => 'INV-0001',
                'referred_by' => 'Tarun',
            ])->assertRedirect();

        $fin = CaseFinancial::where('lead_id', $case->id)->firstOrFail();
        $this->assertSame('INV-0001', $fin->invoice_no);
        $this->assertSame(2350.0, $fin->totalPayable());   // 1500 + 850
        $this->assertSame('Tarun', $case->fresh()->referral); // referral lands on the lead
    }

    public function test_payment_ledger_drives_owed_and_settled(): void
    {
        $case = $this->caseLead();
        $staff = $this->staff();

        $this->actingAs($staff)->post("/portal/immigration/cases/{$case->id}/financials", [
            'service_fee_chargeable' => 1500, 'inz_fee' => 850,
        ])->assertRedirect();

        // Two instalments summing to the total.
        $this->actingAs($staff)->post("/portal/immigration/cases/{$case->id}/financials/payments", [
            'paid_at' => '2026-07-01', 'amount' => 1000, 'reference' => 'Instalment 1',
        ])->assertRedirect();
        $this->actingAs($staff)->post("/portal/immigration/cases/{$case->id}/financials/payments", [
            'paid_at' => '2026-07-20', 'amount' => 1350, 'reference' => 'Instalment 2',
        ])->assertRedirect();

        $fin = CaseFinancial::where('lead_id', $case->id)->firstOrFail();
        $this->assertSame(2350.0, $fin->totalPaid());
        $this->assertSame(0.0, $fin->amountOwed());
        $this->assertTrue($fin->isSettled());
        // Disbursement defaults to the INZ fee → net ePathways revenue.
        $this->assertSame(1500.0, $fin->netAfterDisbursement()); // 2350 paid − 850 INZ

        // Remove a payment → back to outstanding.
        $first = CaseFinancePayment::where('lead_id', $case->id)->orderBy('id')->first();
        $this->actingAs($staff)
            ->delete("/portal/immigration/cases/{$case->id}/financials/payments/{$first->id}")
            ->assertRedirect();

        $fin->refresh();
        $this->assertSame(1000.0, $fin->amountOwed()); // 2350 − 1350
        $this->assertFalse($fin->isSettled());
    }

    public function test_payment_requires_amount_and_date(): void
    {
        $case = $this->caseLead();
        $this->actingAs($this->staff())
            ->post("/portal/immigration/cases/{$case->id}/financials/payments", ['method' => 'cash'])
            ->assertSessionHasErrors(['paid_at', 'amount']);
        $this->assertSame(0, CaseFinancePayment::count());
    }
}
