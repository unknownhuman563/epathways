<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\EoiSubmission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EoiSubmissionController extends Controller
{
    public const STATUSES = ['new', 'reviewed', 'shortlisted', 'declined'];

    public function index(Request $request)
    {
        $status = $request->query('status');
        $search = $request->query('search');
        $formType = $request->query('form_type');

        $submissions = EoiSubmission::latest()
            ->when(
                in_array($status, self::STATUSES, true),
                fn ($q) => $q->where('status', $status)
            )
            ->when(in_array($formType, ['hot', 'cold'], true), fn ($q) => $q->where('form_type', $formType))
            ->when($search, fn ($q) => $q->where(fn ($w) => $w
                ->where('full_legal_name', 'like', "%{$search}%")
                ->orWhere('preferred_name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('mobile', 'like', "%{$search}%")))
            ->paginate(10)
            ->withQueryString();

        return inertia('portal/accommodation/Applications', [
            'submissions' => $submissions,
            'statuses' => self::STATUSES,
            'filters' => ['status' => $status, 'search' => $search, 'form_type' => $formType],
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
