<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Services\AgreementGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The "Standard · Offshore — Zero fees" agreement is the same offshore document
 * with the package fee waived (NZ$0). Tested at the payload level so it doesn't
 * depend on dompdf rendering.
 */
class OffshoreZeroFeeAgreementTest extends TestCase
{
    use RefreshDatabase;

    private function lead(): Lead
    {
        return Lead::create(['first_name' => 'Emma', 'last_name' => 'Thompson', 'email' => 'emma@example.com']);
    }

    public function test_standard_offshore_keeps_its_default_package_fee_and_full_scope(): void
    {
        $payload = app(AgreementGenerator::class)->buildOffshorePayload($this->lead(), []);
        $this->assertSame(3500, $payload['package_fee']);
        $this->assertSame('Documentation, School Enrolment, and Visa Application Fee', $payload['package_scope']);
    }

    public function test_zero_fee_offshore_waives_the_fee_and_drops_visa_application(): void
    {
        $payload = app(AgreementGenerator::class)->buildOffshorePayload($this->lead(), ['zero_fees' => true]);
        $this->assertSame(0, $payload['package_fee']);
        $this->assertSame('Documentation and School Enrolment', $payload['package_scope']);
    }

    public function test_zero_fee_variant_honours_a_typed_fee_but_keeps_its_scope(): void
    {
        // "Zero fees" only sets the DEFAULT to 0 — a typed amount is flexible —
        // but the scope stays "Documentation and School Enrolment" regardless.
        $payload = app(AgreementGenerator::class)->buildOffshorePayload($this->lead(), [
            'zero_fees' => true, 'school_enrolment_fee' => 5000,
        ]);
        $this->assertSame(5000, $payload['package_fee']);
        $this->assertSame('Documentation and School Enrolment', $payload['package_scope']);
    }
}
