<?php

namespace App\Http\Requests;

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCustomerOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Customer::class);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'business' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'whatsapp' => ['nullable', 'string', 'max:32'],
            'email' => ['nullable', 'email', 'max:255'],
            'city' => ['nullable', 'string', 'max:120'],
            'source' => ['nullable', 'string', 'max:64'],
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'owner_id' => ['nullable', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:10000'],

            'contacts' => ['nullable', 'array', 'max:10'],
            'contacts.*.name' => ['required', 'string', 'max:255'],
            'contacts.*.job_title' => ['nullable', 'string', 'max:255'],
            'contacts.*.email' => ['nullable', 'email', 'max:255'],
            'contacts.*.phone' => ['nullable', 'string', 'max:32'],
            'contacts.*.whatsapp' => ['nullable', 'string', 'max:32'],
            'contacts.*.is_primary' => ['boolean'],
            'contacts.*.notes' => ['nullable', 'string', 'max:2000'],

            'application' => ['nullable', 'array'],
            'application.enabled' => ['sometimes', 'boolean'],
            'application.product_id' => [
                'nullable',
                'required_if:application.enabled,true',
                'integer',
                Rule::exists('products', 'id')->where(fn ($query) => $query->whereNull('deleted_at')->where('is_active', true)),
            ],
            'application.name' => ['nullable', 'string', 'max:120'],
            'application.environment' => ['nullable', 'required_if:application.enabled,true', Rule::in(ApplicationInstance::ENVIRONMENTS)],
            'application.status' => ['nullable', 'required_if:application.enabled,true', Rule::in(ApplicationInstance::STATUSES)],
            'application.domain' => ['nullable', 'string', 'max:253', 'regex:/^(?!-)[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/'],
            'application.server_name' => ['nullable', 'string', 'max:255'],
            'application.version' => ['nullable', 'string', 'max:64'],
            'application.provisioning_template_code' => ['nullable', 'string', 'max:64', 'regex:/^[a-z0-9][a-z0-9_-]*$/'],
            'application.notes' => ['nullable', 'string', 'max:5000'],

            'subscription' => ['nullable', 'array'],
            'subscription.enabled' => ['sometimes', 'boolean'],
            'subscription.plan_id' => [
                'nullable',
                'required_if:subscription.enabled,true',
                'integer',
                Rule::exists('plans', 'id')->where(fn ($query) => $query->whereNull('deleted_at')->where('is_active', true)),
            ],
            'subscription.kind' => ['nullable', 'required_if:subscription.enabled,true', Rule::in(Subscription::KINDS)],
            'subscription.status' => ['nullable', 'required_if:subscription.enabled,true', Rule::in(Subscription::STATUSES)],
            'subscription.starts_at' => ['nullable', 'required_if:subscription.enabled,true', 'date'],
            'subscription.ends_at' => ['nullable', 'date', 'after_or_equal:subscription.starts_at'],
            'subscription.renewal_at' => ['nullable', 'date', 'after_or_equal:subscription.starts_at'],
            'subscription.grace_ends_at' => ['nullable', 'date', 'after_or_equal:subscription.ends_at'],
            'subscription.auto_renew' => ['boolean'],
            'subscription.external_reference' => ['nullable', 'string', 'max:120'],
            'subscription.notes' => ['nullable', 'string', 'max:5000'],

            'payment' => ['nullable', 'array'],
            'payment.enabled' => ['sometimes', 'boolean'],
            'payment.invoice_number' => [
                'nullable',
                'required_if:payment.enabled,true',
                'string',
                'max:64',
                Rule::unique('payments', 'invoice_number')->withoutTrashed(),
            ],
            'payment.amount' => ['nullable', 'required_if:payment.enabled,true', 'numeric', 'min:0', 'max:9999999999.99'],
            'payment.currency' => ['nullable', 'required_if:payment.enabled,true', 'string', 'size:3', Rule::in(config('crm.currencies'))],
            'payment.status' => ['nullable', 'required_if:payment.enabled,true', Rule::in(Payment::STATUSES)],
            'payment.method' => ['nullable', Rule::in(Payment::METHODS)],
            'payment.due_at' => ['nullable', 'date'],
            'payment.paid_at' => ['nullable', 'date'],
            'payment.reference' => ['nullable', 'string', 'max:120'],
            'payment.notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'application.domain.regex' => 'Enter a hostname such as shop.counterpos.pk.',
            'application.product_id.required_if' => 'Select a product for the application.',
            'subscription.plan_id.required_if' => 'Select a plan for the subscription.',
        ];
    }
}
