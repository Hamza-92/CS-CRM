<?php

namespace App\Http\Requests;

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

final class StoreCustomerTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Customer::class)
            && $this->user()->can('create', ApplicationInstance::class)
            && $this->user()->can('create', Subscription::class);
    }

    public function rules(): array
    {
        return [
            'tenant_id' => ['required', 'uuid'],
            'existing_customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:255'],
            'business' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'customer_status' => ['required', Rule::in(['active', 'inactive'])],
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')->where(fn ($query) => $query->whereNull('deleted_at')->where('is_active', true))],
            'instance_name' => ['required', 'string', 'max:120'],
            'environment' => ['required', Rule::in(ApplicationInstance::ENVIRONMENTS)],
            'instance_status' => ['required', Rule::in(ApplicationInstance::STATUSES)],
            'plan_id' => ['required', 'integer', Rule::exists('plans', 'id')->where(fn ($query) => $query->whereNull('deleted_at')->where('is_active', true))],
            'subscription_status' => ['required', Rule::in(Subscription::STATUSES)],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after_or_equal:starts_at'],
            'auto_renew' => ['required', 'boolean'],
            'dates_confirmed' => ['accepted'],
        ];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->has('starts_at') || ! $this->filled('starts_at')) {
                return;
            }
            if (in_array($this->input('subscription_status'), ['active', 'trialing', 'past_due'], true)
                && Carbon::parse($this->input('starts_at'))->startOfDay()->greaterThan(today())) {
                $validator->errors()->add('starts_at', 'An active subscription cannot start in the future. Choose a non-active status or change the start date.');
            }
        }];
    }
}
