<?php

namespace App\Http\Requests;

use App\Enums\BillingCycle;
use App\Models\Plan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Plan::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required', 'string', 'max:32', 'regex:/^[A-Za-z0-9\-_]+$/',
                Rule::unique('plans', 'code')
                    ->where('product_id', $this->route('product')->id)
                    ->withoutTrashed(),
            ],
            'billing_cycle' => ['required', Rule::enum(BillingCycle::class)],
            'duration_days' => [
                Rule::requiredIf(fn () => $this->input('billing_cycle') !== BillingCycle::Lifetime->value),
                'nullable', 'integer', 'min:1', 'max:3650',
            ],
            'price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'currency' => ['required', 'string', 'size:3', Rule::in(config('crm.currencies'))],
            'grace_days' => ['required', 'integer', 'min:0', 'max:365'],
            'is_active' => ['boolean'],
            'sort_order' => ['integer', 'min:0', 'max:9999'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->input('billing_cycle') === BillingCycle::Lifetime->value) {
            $this->merge(['duration_days' => null]);
        }
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.regex' => 'The code may only contain letters, numbers, hyphens and underscores.',
            'duration_days.required' => 'A duration is required for every plan except Lifetime.',
        ];
    }
}
