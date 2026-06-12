<?php

namespace App\Http\Requests\Onboarding;

use App\Models\Tenant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ConvertToTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'property_id' => ['required', Rule::exists('accommodation_properties', 'id')->where('is_active', true)],
            'unit' => ['nullable', 'string', 'max:50'],
            'first_name' => ['required', 'string', 'max:100'],
            'family_name' => ['required', 'string', 'max:100'],
            'display_name_override' => ['nullable', 'string', 'max:200'],
            'email' => ['nullable', 'email', 'max:200'],
            'phone' => ['nullable', 'string', 'max:50'],
            'contract_type' => ['required', Rule::in(Tenant::CONTRACT_TYPES)],
            'contract_start' => ['required', 'date'],
            'contract_end' => array_values(array_filter(['nullable', 'date', $this->filled('contract_start') ? 'after:contract_start' : null])),
            'weekly_rent_nzd' => ['nullable', 'numeric', 'min:0'],
            'weekly_utilities_nzd' => ['nullable', 'numeric', 'min:0'],
            'bond_paid_nzd' => ['nullable', 'numeric', 'min:0'],
            'advance_paid_nzd' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
