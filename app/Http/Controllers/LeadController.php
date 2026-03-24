<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Http\Requests\StoreLeadRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadController extends Controller
{
    /**
     * Store a newly created complex Lead in storage securely.
     */
    public function store(StoreLeadRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();
            
            // 1. Create Base Lead
            $leadData = $request->except(['education', 'study_plans']);
            
            // Generate a temporary unique LP identifier if none provided
            if (!isset($leadData['lead_id'])) {
                $leadData['lead_id'] = 'LP-' . rand(10000, 99999);
            }
            
            $lead = Lead::create($leadData);
            
            // 2. Attach Education Experiences safely
            if ($request->has('education')) {
                foreach ($request->input('education') as $edu) {
                    $lead->educationExps()->create($edu);
                }
            }
            
            // 3. Attach Study Plans safely
            if ($request->has('study_plans')) {
                foreach ($request->input('study_plans') as $plan) {
                    $lead->studyPlans()->create($plan);
                }
            }
            
            DB::commit();
            
            return response()->json([
                'status' => 'success',
                'message' => 'Lead successfully ingested with related arrays.',
                'data' => $lead->load(['educationExps', 'studyPlans'])
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Lead storage failed', ['error' => $e->getMessage()]);
            
            return response()->json([
                'status' => 'error',
                'message' => 'Failed to create lead due to server error.'
            ], 500);
        }
    }
}
