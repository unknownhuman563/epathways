<?php

namespace Tests\Feature\Immigration;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Reaching a lodged stage auto-stamps inz_lodged_at (defaulting to today) so the
 * processing tracker works without a separate manual entry — but it never
 * overwrites an existing date, and never fires for a pre-lodgement withdrawal.
 */
class AutoStampLodgementTest extends TestCase
{
    use RefreshDatabase;

    private function case(array $extra = []): Lead
    {
        return Lead::create(array_merge([
            'first_name' => 'A', 'last_name' => 'B', 'is_immigration_case' => true,
            'immigration_stage' => 'Invoice Paid',
        ], $extra));
    }

    public function test_reaching_visa_lodged_stamps_todays_date(): void
    {
        $lead = $this->case();
        $this->assertNull($lead->inz_lodged_at);

        $lead->update(['immigration_stage' => 'Visa Lodged']);

        $this->assertNotNull($lead->fresh()->inz_lodged_at);
        $this->assertSame(now()->toDateString(), $lead->fresh()->inz_lodged_at->toDateString());
    }

    public function test_jumping_to_a_later_lodged_stage_also_stamps(): void
    {
        $lead = $this->case();
        $lead->update(['immigration_stage' => 'Approved Visa']); // skipped "Visa Lodged"
        $this->assertNotNull($lead->fresh()->inz_lodged_at);
    }

    public function test_it_never_overwrites_an_existing_lodgement_date(): void
    {
        $lead = $this->case(['inz_lodged_at' => '2026-07-01']);
        $lead->update(['immigration_stage' => 'Visa Lodged']);
        $this->assertSame('2026-07-01', $lead->fresh()->inz_lodged_at->toDateString());
    }

    public function test_withdrawn_does_not_stamp_a_lodgement_date(): void
    {
        $lead = $this->case(['immigration_stage' => 'Agreement Sent']);
        $lead->update(['immigration_stage' => 'Withdrawn']);
        $this->assertNull($lead->fresh()->inz_lodged_at);
    }
}
