<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePaymentRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('update', $this->route('payment')); }
    public function rules(): array
    {
        return [
            'subscription_id' => ['required', 'integer', Rule::exists('subscriptions', 'id')->whereNull('deleted_at')],
            'invoice_number' => ['required', 'string', 'max:64', Rule::unique('payments', 'invoice_number')->ignore($this->route('payment'))->withoutTrashed()],
            'amount' => ['required', 'numeric', 'min:0', 'max:9999999999.99'],
            'currency' => ['required', 'string', 'size:3', Rule::in(config('crm.currencies'))],
            'status' => ['required', Rule::in(Payment::STATUSES)],
            'method' => ['nullable', Rule::in(Payment::METHODS)],
            'due_at' => ['nullable', 'date'],
            'paid_at' => ['nullable', 'date'],
            'reference' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
