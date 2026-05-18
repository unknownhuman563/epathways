<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Program;
use Illuminate\Support\Facades\Log;

class EducationController extends Controller
{
    /** Education overview: programs, students (study-plan leads), recent intakes. */
    public function dashboard()
    {
        try {
            $now = now();
            $monthStart = $now->copy()->startOfMonth();

            $programStats = [
                'total' => Program::count(),
                'published' => Program::where('status', 'published')->count(),
                'draft' => Program::where('status', 'draft')->count(),
                'archived' => Program::where('status', 'archived')->count(),
            ];

            $studentStats = [
                'total_with_plan' => Lead::has('studyPlans')->count(),
                'this_month' => Lead::has('studyPlans')->where('created_at', '>=', $monthStart)->count(),
                'qualified' => Lead::has('studyPlans')->whereIn('status', ['Qualified', 'Processing'])->count(),
                'enrolled' => Lead::has('studyPlans')->where('status', 'Closed')->count(),
            ];

            $recentStudents = Lead::with('studyPlans')->has('studyPlans')
                ->latest()->limit(8)->get()->map(function ($l) {
                    return [
                        'id' => $l->id,
                        'lead_id' => $l->lead_id,
                        'name' => trim("{$l->first_name} {$l->last_name}") ?: 'Unknown',
                        'email' => $l->email,
                        'course' => optional($l->studyPlans->first())->preferred_course,
                        'level' => optional($l->studyPlans->first())->preferred_level,
                        'status' => $l->status ?: 'New',
                        'created_at' => $l->created_at,
                    ];
                });

            $recentPrograms = Program::latest()->limit(6)->get(['id', 'title', 'slug', 'status', 'updated_at']);

            return inertia('portal/education/Dashboard', [
                'programStats' => $programStats,
                'studentStats' => $studentStats,
                'recentStudents' => $recentStudents,
                'recentPrograms' => $recentPrograms,
            ]);
        } catch (\Throwable $e) {
            Log::error('Education dashboard failed', ['error' => $e->getMessage()]);

            return inertia('portal/education/Dashboard', [
                'programStats' => array_fill_keys(['total', 'published', 'draft', 'archived'], 0),
                'studentStats' => array_fill_keys(['total_with_plan', 'this_month', 'qualified', 'enrolled'], 0),
                'recentStudents' => collect(),
                'recentPrograms' => collect(),
            ]);
        }
    }
}
