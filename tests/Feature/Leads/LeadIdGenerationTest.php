<?php

namespace Tests\Feature\Leads;

use App\Models\Lead;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression for the Sumit Kumar conversion loop: `LP-`.(max(id)+1000) landed
 * on a lead_id that already existed, so the insert died on the unique index and
 * every retry recomputed the same colliding value forever. generateLeadId() must
 * always return a genuinely free identifier — including past soft-deleted rows.
 */
class LeadIdGenerationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_never_returns_an_existing_lead_id(): void
    {
        $a = Lead::create(['first_name' => 'A', 'last_name' => 'One']);
        $b = Lead::create(['first_name' => 'B', 'last_name' => 'Two']);

        // Force the exact drift that broke prod: the highest-id row already holds
        // the lead_id that (max(id)+1000) would generate next.
        $collidingId = 'LP-'.str_pad((string) ($b->id + 1000), 5, '0', STR_PAD_LEFT);
        $b->forceFill(['lead_id' => $collidingId])->save();

        $generated = Lead::generateLeadId();

        $this->assertNotSame($collidingId, $generated, 'must not reuse the taken id');
        $this->assertSame(0, Lead::where('lead_id', $generated)->count(), 'must be free');

        // And it actually inserts without a unique-constraint violation.
        $new = Lead::create(['first_name' => 'C', 'last_name' => 'Three', 'lead_id' => $generated]);
        $this->assertDatabaseHas('leads', ['id' => $new->id, 'lead_id' => $generated]);
        unset($a);
    }

    public function test_it_skips_a_lead_id_held_by_a_soft_deleted_row(): void
    {
        // A soft-deleted lead still occupies its lead_id on the unique index.
        $ghost = Lead::create(['first_name' => 'Ghost', 'last_name' => 'Row']);
        $taken = Lead::generateLeadId();
        $ghost->forceFill(['lead_id' => $taken])->save();
        $ghost->delete(); // soft delete — row (and its lead_id) remain in the table

        $next = Lead::generateLeadId();

        $this->assertNotSame($taken, $next);
        $this->assertSame(0, Lead::withTrashed()->where('lead_id', $next)->count());
    }

    public function test_generated_ids_are_sequential_and_unique_across_a_batch(): void
    {
        $ids = [];
        for ($i = 0; $i < 5; $i++) {
            $id = Lead::generateLeadId();
            Lead::create(['first_name' => "L{$i}", 'last_name' => 'Batch', 'lead_id' => $id]);
            $ids[] = $id;
        }

        $this->assertCount(5, array_unique($ids), 'all five must be distinct');
    }
}
