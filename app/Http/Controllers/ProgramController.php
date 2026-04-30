<?php

namespace App\Http\Controllers;

use App\Models\Program;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProgramController extends Controller
{
    private function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'institution' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'level' => 'required|integer|min:1|max:10',
            'category' => 'required|in:diplomas,bachelors,masters',
            'status' => 'required|in:draft,published,archived',
            'price_text' => 'nullable|string|max:255',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp,gif|max:4096',
            'description' => 'nullable|string',
            'intake_months' => 'nullable|string|max:255',
            'duration_months' => 'nullable|integer|min:0',
            'credits' => 'nullable|integer|min:0',
            'residency_points' => 'nullable|integer|min:0',
            'hours_per_week' => 'nullable|integer|min:0',
            'entry_requirements' => 'nullable|array',
            'entry_requirements.*' => 'nullable|array',
            'entry_requirements.*.intro' => 'nullable|string',
            'entry_requirements.*.bullets' => 'nullable|array',
            'entry_requirements.*.bullets.*' => 'nullable|string',
            'english_requirements' => 'nullable|string',
            'specialization' => 'nullable|string',
            'employment_outcomes' => 'nullable|array',
            'employment_outcomes.*' => 'nullable|array',
            'employment_outcomes.*.intro' => 'nullable|string',
            'employment_outcomes.*.bullets' => 'nullable|array',
            'employment_outcomes.*.bullets.*' => 'nullable|string',
            'post_study' => 'nullable|string',
            'other_benefits' => 'nullable|array',
            'other_benefits.*' => 'nullable|string',
            'fee_guide' => 'nullable|array',
            'fee_guide.*.region' => 'nullable|string|max:255',
            'fee_guide.*.fee' => 'nullable|numeric|min:0',
            'tuition_fee' => 'nullable|numeric|min:0',
            'tuition_fee_notes' => 'nullable|string|max:255',
            'insurance_fee' => 'nullable|numeric|min:0',
            'visa_processing_fee' => 'nullable|numeric|min:0',
            'living_expense' => 'nullable|numeric|min:0',
            'accommodation' => 'nullable|string|max:255',
        ];
    }

    private function appendImageUrl(Program $program): Program
    {
        $program->image_url = $program->image
            ? Storage::disk('public')->url($program->image)
            : null;

        return $program;
    }

    public function index()
    {
        $programs = Program::latest()->get();
        $programs->each(fn ($p) => $this->appendImageUrl($p));

        return inertia('Admin/Programs', ['programs' => $programs]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate($this->rules());

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('programs/banners', 'public');
        }

        Program::create($validated);

        return redirect()->back()->with('success', 'Program created successfully.');
    }

    public function update(Request $request, $id)
    {
        $program = Program::findOrFail($id);
        $validated = $request->validate($this->rules());

        if ($request->hasFile('image')) {
            if ($program->image) {
                Storage::disk('public')->delete($program->image);
            }
            $validated['image'] = $request->file('image')->store('programs/banners', 'public');
        } else {
            unset($validated['image']);
        }

        $program->update($validated);

        return redirect()->back()->with('success', 'Program updated successfully.');
    }

    public function destroy($id)
    {
        $program = Program::findOrFail($id);

        if ($program->image) {
            Storage::disk('public')->delete($program->image);
        }

        $program->delete();

        return redirect()->back()->with('success', 'Program deleted successfully.');
    }

    public function publicIndex()
    {
        return inertia('ProgramsLevels', ['programs' => $this->fetchPublishedPrograms()]);
    }

    public function feeGuideIndex()
    {
        return inertia('FeeGuide', ['programs' => $this->fetchPublishedPrograms()]);
    }

    private function fetchPublishedPrograms()
    {
        $programs = Program::where('status', 'published')->orderBy('level')->latest()->get();
        $programs->each(fn ($p) => $this->appendImageUrl($p));

        return $programs;
    }

    public function publicShow($id)
    {
        $program = Program::where('status', 'published')->findOrFail($id);
        $this->appendImageUrl($program);

        return inertia('ProgramDetails', ['program' => $program]);
    }
}
