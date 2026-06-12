<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RenewTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'new_contract_start' => 'required|date',
            'new_contract_end' => 'required|date|after:new_contract_start',
        ];
    }
}
