<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\EoiSubmission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EoiSubmissionController extends Controller
{
    public const STATUSES = ['new', 'reviewed', 'shortlisted', 'declined'];

    public function index()
    {
        $submissions = EoiSubmission::latest()->get();

        return inertia('portal/accommodation/Applications', [
            'submissions' => $submissions,
            'statuses' => self::STATUSES,
        ]);
    }

    public function show(EoiSubmission $submission)
    {
        return inertia('portal/accommodation/ApplicationDetails', [
            'submission' => $submission,
            'statuses' => self::STATUSES,
        ]);
    }

    public function updateStatus(Request $request, EoiSubmission $submission)
    {
        $data = $request->validate([
            'status' => ['required', Rule::in(self::STATUSES)],
        ]);

        $submission->update($data);

        return redirect()->back()->with('success', 'Status updated.');
    }

    public function destroy(EoiSubmission $submission)
    {
        $submission->delete();

        return redirect()->route('portal.accommodation.applications.index')
            ->with('success', 'Application deleted.');
    }
}
