<?php

namespace App\Http\Requests;

use App\Models\Deal;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDealRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Deal::class);
    }

    public function rules(): array
    {
        $currencies = config('crm.currencies', ['USD']);
        $currencyValues = array_is_list($currencies) ? $currencies : array_keys($currencies);

        return [
            'title' => ['required', 'string', 'max:255'],
            'lead_id' => ['nullable', 'integer', Rule::exists('leads', 'id')->whereNull('deleted_at')],
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'product_id' => ['nullable', 'integer', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'plan_id' => ['nullable', 'integer', Rule::exists('plans', 'id')->whereNull('deleted_at')],
            'stage_id' => ['required', 'integer', Rule::exists('deal_stages', 'id')->where('status', 'active')],
            'owner_id' => ['nullable', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'amount' => ['required', 'numeric', 'min:0', 'max:999999999999.99'],
            'currency' => ['required', 'string', Rule::in($currencyValues)],
            'probability' => ['nullable', 'integer', 'min:0', 'max:100'],
            'expected_close_date' => ['nullable', 'date'],
            'next_step' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:10000'],
            'loss_reason' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            if ($this->filled('lead_id') === $this->filled('customer_id')) {
                $validator->errors()->add('lead_id', 'Choose exactly one lead or customer.');
            }

            if ($this->filled('plan_id') && ! $this->filled('product_id')) {
                $validator->errors()->add('plan_id', 'Select a product before selecting a plan.');
            }
        });
    }
}
