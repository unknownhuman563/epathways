<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\SavesIntakeDraft;
use App\Services\LeadIntakeService;
use Illuminate\Http\Request;

/**
 * One public endpoint behind all five visa-intake auto-saves. The five forms
 * differ only in which questions they ask, and a draft stores the answers
 * wholesale, so there is nothing per-visa to fork a controller over — the visa
 * type arrives as a route segment and picks the `source` to stamp.
 *
 * Unauthenticated by design: these are public funnels, and the draft is the
 * applicant's own in-progress form. Rate limiting is applied on the route.
 */
class VisaIntakeDraftController extends Controller
{
    use SavesIntakeDraft;

    public function store(Request $request, string $visa, LeadIntakeService $intake)
    {
        return $this->saveIntakeDraft($request, $visa, $intake);
    }
}
