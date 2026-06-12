<?php

namespace App\Http\Requests\Onboarding;

use App\Support\OnboardingPipeline;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route is behind portal:accommodation
    }

    public function rules(): array
    {
        $target = $this->input('status');

        return [
            'status' => ['required', Rule::in(OnboardingPipeline::allStatuses())],
            // Stage-specific required data.
            'viewing_scheduled_at' => [Rule::requiredIf($target === 'viewing_booked'), 'nullable', 'date'],
            'viewing_outcome' => ['nullable', 'string', 'max:5000'],
            'pre_tenancy_form_data' => ['nullable', 'array'],
            'invoice_amount_nzd' => [Rule::requiredIf($target === 'invoice_sent'), 'nullable', 'numeric', 'min:0'],
            'move_in_date' => [Rule::requiredIf($target === 'moved_in'), 'nullable', 'date'],
            'declined_reason' => [Rule::requiredIf($target === 'declined'), 'nullable', 'string', 'max:2000'],
            'not_proceeding_reason' => [Rule::requiredIf($target === 'not_proceeding'), 'nullable', 'string', 'max:2000'],
        ];
    }

    /** Stage payload to merge into the submission (everything but the status). */
    public function stageData(): array
    {
        return collect($this->validated())
            ->except('status')
            ->filter(fn ($v) => $v !== null && $v !== '')
            ->all();
    }
}
