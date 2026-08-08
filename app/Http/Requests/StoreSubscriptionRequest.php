<?php

namespace App\Http\Requests;

use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubscriptionRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('create', Subscription::class); }
    public function rules(): array
    {
        return [
            'application_instance_id' => ['required', 'integer', Rule::exists('application_instances', 'id')->whereNull('deleted_at')],
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->whereNull('deleted_at')],
            'kind' => ['required', Rule::in(Subscription::KINDS)],
            'status' => ['required', Rule::in(Subscription::STATUSES)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'renewal_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'grace_ends_at' => ['nullable', 'date', 'after_or_equal:ends_at'],
            'cancelled_at' => ['nullable', 'date'],
            'auto_renew' => ['boolean'],
            'external_reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
