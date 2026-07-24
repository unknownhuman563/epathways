<?php

namespace Tests\Feature;

use App\Models\Program;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression for "editing a program wipes its information".
 *
 * Root cause: the Sales / Education programs pages shipped a TRIMMED program
 * row to the shared ProgramModal. Fields the row omitted rendered blank in the
 * edit form and were then posted back as empty, blanking the columns. These
 * tests lock in that every portal ships the full program, plus a defensive
 * check that a subset payload can't blank untouched columns.
 */
class ProgramPartialUpdateTest extends TestCase
{
    use RefreshDatabase;

    /** Fields the edit modal owns that used to be missing from portal payloads. */
    private const REQUIRED_EDIT_FIELDS = [
        'entry_requirements', 'employment_outcomes', 'other_benefits', 'fee_guide',
        'tuition_fees', 'english_requirements', 'specialization', 'post_study',
        'accommodation', 'credits', 'residency_points', 'hours_per_week',
        'insurance_fee', 'visa_processing_fee', 'living_expense',
    ];

    private function makeProgram(): Program
    {
        return Program::create([
            'title' => 'Original title',
            'level' => 5,
            'category' => 'diplomas',
            'status' => 'draft',
            'description' => 'Long description that must survive.',
            'english_requirements' => 'IELTS 6.0',
            'specialization' => 'Nursing',
            'post_study' => 'Post study work rights',
            'accommodation' => 'Homestay',
            'credits' => 120,
            'residency_points' => 10,
            'hours_per_week' => 20,
            'insurance_fee' => 700,
            'visa_processing_fee' => 500,
            'living_expense' => 20000,
            'entry_requirements' => [['intro' => 'Entry intro', 'bullets' => ['A', 'B']]],
            'employment_outcomes' => [['intro' => 'Jobs', 'bullets' => ['Nurse']]],
            'other_benefits' => ['Benefit one'],
            'fee_guide' => [['region' => 'India & Subcontinent', 'fee' => 100]],
            'tuition_fees' => [['label' => 'Year 1', 'amount' => '1000', 'notes' => 'per year']],
        ]);
    }

    public static function portalProvider(): array
    {
        return [
            'education' => ['education', '/portal/education/programs'],
            'sales'     => ['sales', '/portal/sales/programs'],
            'admin'     => ['admin', '/admin/programs'],
        ];
    }

    /**
     * The edit modal seeds its form from this payload — every field it can edit
     * must be present, or saving blanks that column.
     *
     * @dataProvider portalProvider
     */
    public function test_portal_programs_page_ships_the_full_program(string $role, string $url): void
    {
        $this->makeProgram();
        $user = User::factory()->create(['role' => $role]);

        $response = $this->actingAs($user)->get($url);
        $response->assertOk();

        $programs = $response->viewData('page')['props']['programs'];
        $first = json_decode(json_encode($programs), true)[0];

        foreach (self::REQUIRED_EDIT_FIELDS as $field) {
            $this->assertArrayHasKey(
                $field,
                $first,
                "{$role} programs page omits `{$field}` — the edit modal would render it blank and wipe it on save."
            );
        }
    }

    public function test_partial_update_does_not_wipe_untouched_columns(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $program = $this->makeProgram();

        $this->actingAs($admin)->post("/admin/programs/{$program->id}", [
            'title' => 'Edited title',
            'level' => 5,
            'category' => 'diplomas',
            'status' => 'draft',
        ])->assertRedirect();

        $program->refresh();

        $this->assertSame('Edited title', $program->title);
        $this->assertSame('Long description that must survive.', $program->description);
        $this->assertSame('IELTS 6.0', $program->english_requirements);
        $this->assertSame('Nursing', $program->specialization);
        $this->assertEquals([['intro' => 'Entry intro', 'bullets' => ['A', 'B']]], $program->entry_requirements);
        $this->assertEquals(['Benefit one'], $program->other_benefits);
        $this->assertNotEmpty($program->tuition_fees);
    }

    public function test_explicitly_cleared_field_still_clears(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $program = $this->makeProgram();

        $this->actingAs($admin)->post("/admin/programs/{$program->id}", [
            'title' => 'Original title',
            'level' => 5,
            'category' => 'diplomas',
            'status' => 'draft',
            'specialization' => '',
        ])->assertRedirect();

        $this->assertNull($program->refresh()->specialization);
    }
}
