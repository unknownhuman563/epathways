<?php

namespace App\Http\Requests;

use App\Models\VisaType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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

        $ignoreId = $visaType?->id;

        return [
            // A name must not duplicate another visa's CODE (and vice versa)
            // — an ambiguous value can't be resolved to a single catalogue
            // row, which is what made the tracker show the wrong checklist.
            'name' => [
                'required', 'string', 'max:100',
                function ($attr, $value, $fail) use ($ignoreId) {
                    if ($clash = VisaType::otherCoded($value, $ignoreId)) {
                        $fail("This name is already used as the code of the visa \"{$clash->name}\". Codes and names must not overlap.");
                    }
                },
            ],
            'code' => [
                'required', 'string', 'max:32', 'regex:/^[A-Z0-9_-]+$/',
                Rule::unique('visa_types', 'code')->ignore($ignoreId),
                function ($attr, $value, $fail) use ($ignoreId) {
                    if ($clash = VisaType::otherNamed($value, $ignoreId)) {
                        $fail("This code is already used as the name of the visa \"{$clash->name}\". Codes and names must not overlap.");
                    }
                },
            ],
            'short_description' => 'nullable|string|max:200',
            'visa_type' => 'nullable|string|max:60',
            'consultation_price_nzd' => 'required|numeric|min:0|max:5000',
            'professional_fees' => 'nullable|numeric|min:0|max:1000000',
            'inz_application_fee' => 'nullable|numeric|min:0|max:1000000',
            'consultation_duration_minutes' => 'required|integer|min:15|max:180',
            'estimated_minutes' => 'required|integer|min:5|max:60',
            'inz_form_refs' => 'nullable|string|max:120',
            'icon' => 'required|string|max:60',
            'active' => 'required|boolean',
            // Per-visa document checklist. Each item must carry a stable
            // `key` (snake_case identifier used to match LeadDocument
            // uploads) and a human label.
            'checklist_items' => 'nullable|array|max:50',
            'checklist_items.*.key' => 'required|string|max:80|regex:/^[a-z0-9_]+$/',
            'checklist_items.*.label' => 'required|string|max:120',
            // Section/group heading. MUST be validated — anything not listed
            // here is stripped by validate(), which would silently drop the
            // grouping from every item the moment a visa is saved.
            'checklist_items.*.category' => 'nullable|string|max:60',
            'checklist_items.*.hint' => 'nullable|string|max:200',
            'checklist_items.*.required' => 'sometimes|boolean',
            // File-naming metadata used to auto-rename uploads:
            // "NN - CODE - FirstnameLASTNAME<suffix>".
            'checklist_items.*.file_code' => 'nullable|string|max:20',
            'checklist_items.*.file_suffix' => 'nullable|string|max:40',
        ];
    }

    public function messages(): array
    {
        return [
            'code.regex' => 'Code must be uppercase letters, numbers, dashes, or underscores only.',
            'code.unique' => 'A visa type with that code already exists.',
            'consultation_price_nzd.min' => 'Price cannot be negative',
            'consultation_price_nzd.max' => 'Price cannot exceed $5000 NZD',
            'consultation_duration_minutes.min' => 'Duration must be between 15 and 180 minutes',
            'consultation_duration_minutes.max' => 'Duration must be between 15 and 180 minutes',
        ];
    }
}
