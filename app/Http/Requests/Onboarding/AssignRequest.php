<?php

namespace App\Http\Requests\Onboarding;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Must be a member of the Accommodation team (or an admin).
            'user_id' => ['required', Rule::exists('users', 'id')->whereIn('role', ['accommodation', 'admin'])],
        ];
    }
}
