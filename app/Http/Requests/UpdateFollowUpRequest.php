<?php

namespace App\Http\Requests;

use App\Models\FollowUp;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFollowUpRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('update', $this->route('followUp')); }

    public function rules(): array
    {
        return [
            'lead_id' => ['nullable', 'integer', 'exists:leads,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'deal_id' => ['nullable', 'integer', 'exists:deals,id'],
            'application_instance_id' => ['nullable', 'integer', 'exists:application_instances,id'],
            'reason' => ['required', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:10000'],
            'owner_id' => ['nullable', 'integer', 'exists:users,id'],
            'scheduled_at' => ['required', 'date'],
            'status' => ['required', Rule::in(FollowUp::STATUSES)],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if (collect(['lead_id', 'customer_id', 'deal_id', 'application_instance_id'])->filter(fn ($field) => $this->filled($field))->count() !== 1) {
                $validator->errors()->add('lead_id', 'Choose exactly one linked record.');
            }
        });
    }
}
