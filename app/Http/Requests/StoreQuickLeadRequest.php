<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuickLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'     => 'required|string|max:120',
            'email'    => 'required|email|max:255',
            'phone'    => 'required|string|max:25',
            'interest' => 'nullable|string|in:Education,Immigration,Accommodation,General',
            // Where on the site this submission came from — purely a sales-routing
            // hint. Kept loose-validated as a free string so we can add new entry
            // points (hero, exit-intent, fee-guide, …) without touching this list.
            'source'   => 'required|string|max:60',
        ];
    }
}
