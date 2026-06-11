<?php

namespace App\Http\Requests;

use App\Models\VisaType;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVisaTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $visaType = $this->route('visa_type');
        return $visaType instanceof VisaType
            && $this->user()?->can('update', $visaType);
    }

    public function rules(): array
    {
        /** @var VisaType $visaType */
        $visaType = $this->route('visa_type');

        // Reason is only mandatory when the submitted price actually differs
        // from what's currently on the row.
        $priceChanged = $this->filled('consultation_price_nzd')
            && abs(((float) $this->input('consultation_price_nzd')) - ((float) $visaType->consultation_price_nzd)) > 0.0001;

        return [
            'name'                          => 'required|string|max:100',
            'short_description'             => 'nullable|string|max:200',
            'consultation_price_nzd'        => 'required|numeric|min:50|max:1000',
            'consultation_duration_minutes' => 'required|integer|min:15|max:180',
            'estimated_minutes'             => 'required|integer|min:5|max:60',
            'inz_form_refs'                 => 'nullable|string|max:120',
            'icon'                          => 'required|string|max:60',
            'active'                        => 'required|boolean',
            // Per-visa document checklist. Each item must carry a stable
            // `key` (snake_case identifier used to match LeadDocument
            // uploads) and a human label.
            'checklist_items'               => 'nullable|array|max:50',
            'checklist_items.*.key'         => 'required|string|max:80|regex:/^[a-z0-9_]+$/',
            'checklist_items.*.label'       => 'required|string|max:120',
            'checklist_items.*.hint'        => 'nullable|string|max:200',
            'checklist_items.*.required'    => 'sometimes|boolean',
            'reason'                        => $priceChanged
                ? 'required|string|min:10|max:500'
                : 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'consultation_price_nzd.min' => 'Price must be at least $50 NZD',
            'consultation_price_nzd.max' => 'Price cannot exceed $1000 NZD',
            'consultation_duration_minutes.min' => 'Duration must be between 15 and 180 minutes',
            'consultation_duration_minutes.max' => 'Duration must be between 15 and 180 minutes',
            'reason.required' => 'A reason is required when changing the price',
            'reason.min'      => 'Please provide a more detailed reason (minimum 10 characters)',
        ];
    }
}
