<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Personal Information
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'age' => 'nullable|integer|min:0|max:120',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'gender' => 'nullable|string|in:Male,Female,Other',
            'marital_status' => 'nullable|string',
            
            // Categorization
            'branch' => 'nullable|string|in:Philippines,India,Malaysia',
            'stage' => 'nullable|string',
            'status' => 'nullable|string',
            
            // Nested JSON Arrays
            'work_info' => 'nullable|array',
            'work_info.*.id' => 'required_with:work_info|integer',
            'work_info.*.item' => 'required_with:work_info|string',
            
            'financial_info' => 'nullable|array',
            'financial_info.*.id' => 'required_with:financial_info|integer',
            'financial_info.*.item' => 'required_with:financial_info|string',
            'financial_info.*.answer' => 'nullable|string',

            // Relational Data - Education
            'education' => 'nullable|array',
            'education.*.level' => 'required_with:education|string',
            'education.*.institution' => 'required_with:education|string',
            'education.*.start_date' => 'nullable|date',
            'education.*.end_date' => 'nullable|date|after_or_equal:education.*.start_date',
            'education.*.average_marks' => 'nullable|string',
            'education.*.field_of_study' => 'nullable|string',
            
            // Relational Data - Study Plans
            'study_plans' => 'nullable|array',
            'study_plans.*.preferred_course' => 'required_with:study_plans|string',
            'study_plans.*.qualification_level' => 'required_with:study_plans|string',
            'study_plans.*.preferred_city' => 'nullable|string',
            'study_plans.*.preferred_intake' => 'nullable|string',
            'study_plans.*.english_test_taken' => 'nullable|boolean',
        ];
    }
}
