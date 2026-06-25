<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Schools catalog — institutions the Education team places students
 * into. CRUD surface mirrors the Programs catalog so the management
 * pattern stays consistent.
 */
class SchoolController extends Controller
{
    public function index(Request $request)
    {
        $schools = School::orderBy('name')->get();
        // Pick the Inertia page name by URL prefix so the education
        // portal gets EducationLayout chrome while admins still get
        // AdminLayout — same controller, same data, two wrappers.
        $page = $request->is('portal/education/*') ? 'portal/education/Schools' : 'admin/Schools';
        return inertia($page, ['schools' => $schools]);
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);
        try {
            School::create($data);
            return back()->with('success', 'School added.');
        } catch (\Throwable $e) {
            Log::error('School store failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Could not add school.');
        }
    }

    public function update(Request $request, $id)
    {
        $school = School::findOrFail($id);
        $data = $this->validatePayload($request, $school->id);
        try {
            $school->update($data);
            return back()->with('success', 'School updated.');
        } catch (\Throwable $e) {
            Log::error('School update failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Could not update school.');
        }
    }

    public function destroy($id)
    {
        $school = School::findOrFail($id);
        try {
            $school->delete();
            return back()->with('success', 'School removed.');
        } catch (\Throwable $e) {
            Log::error('School delete failed', ['error' => $e->getMessage()]);
            return back()->with('error', 'Could not remove school.');
        }
    }

    private function validatePayload(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name'        => 'required|string|max:191',
            'country'     => 'nullable|string|max:120',
            'city'        => 'nullable|string|max:120',
            'website'     => 'nullable|url|max:512',
            'description' => 'nullable|string|max:5000',
            'status'      => ['nullable', Rule::in(['active', 'inactive'])],
        ]);
    }
}
