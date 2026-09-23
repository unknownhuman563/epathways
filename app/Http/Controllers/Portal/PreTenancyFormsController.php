<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\PreTenancyForm;
use Illuminate\Support\Facades\Storage;

/**
 * Forms → Pre-Tenancy module. Shows the one shared public form link (copy &
 * send) and lists everyone who submitted the standalone/general form — the
 * applicants who skipped the hot-lead funnel and went straight to pre-tenancy.
 */
class PreTenancyFormsController extends Controller
{
    public function index()
    {
        $submissions = PreTenancyForm::latest('submitted_at')->get()->map(fn (PreTenancyForm $f) => [
            'id' => $f->id,
            'reference' => $f->reference,
            'name' => $f->full_legal_name,
            'email' => $f->email,
            'mobile' => $f->mobile,
            'property_address' => $f->property_address,
            'submitted_at' => optional($f->submitted_at)->toIso8601String(),
        ]);

        return inertia('portal/accommodation/forms/PreTenancyForms', [
            'formUrl' => route('pre-tenancy.general'),
            'submissions' => $submissions,
        ]);
    }

    /** View one general submission's full responses (staff). */
    public function show(PreTenancyForm $form)
    {
        return inertia('portal/accommodation/forms/PreTenancyFormDetail', [
            'form' => [
                'id' => $form->id,
                'reference' => $form->reference,
                'name' => $form->full_legal_name,
                'email' => $form->email,
                'mobile' => $form->mobile,
                'submitted_at' => optional($form->submitted_at)->toIso8601String(),
                'data' => $form->data,
            ],
        ]);
    }

    /** Stream a general-submission document (valid_id / visa) from the private disk. */
    public function download(\Illuminate\Http\Request $request, PreTenancyForm $form, string $kind)
    {
        abort_unless(in_array($kind, ['valid_id', 'visa'], true), 404);
        $doc = $form->data['documents'][$kind] ?? null;
        abort_unless($doc && ! empty($doc['path']) && Storage::disk('local')->exists($doc['path']), 404);

        $name = $doc['name'] ?? basename($doc['path']);
        if ($request->boolean('inline')) {
            return response()->file(Storage::disk('local')->path($doc['path']), ['Content-Disposition' => 'inline; filename="'.$name.'"']);
        }

        return Storage::disk('local')->download($doc['path'], $name);
    }
}
