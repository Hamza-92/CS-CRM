<?php

namespace App\Http\Requests;

use App\Models\ApplicationInstance;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationInstanceRequest extends FormRequest
{
    public function authorize(): bool { return $this->user()->can('update', $this->route('applicationInstance')); }
    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', Rule::exists('customers', 'id')->whereNull('deleted_at')],
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')->whereNull('deleted_at')],
            'owner_id' => ['nullable', 'integer', Rule::exists('users', 'id')->whereNull('deleted_at')],
            'name' => ['required', 'string', 'max:120'],
            'environment' => ['required', Rule::in(ApplicationInstance::ENVIRONMENTS)],
            'status' => ['required', Rule::in(ApplicationInstance::STATUSES)],
            'deployment_url' => ['nullable', 'url', 'max:500'],
            'server_name' => ['nullable', 'string', 'max:255'],
            'version' => ['nullable', 'string', 'max:64'],
            'deployed_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
