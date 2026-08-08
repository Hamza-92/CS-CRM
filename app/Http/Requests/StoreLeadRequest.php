<?php

namespace App\Http\Requests;

use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Lead::class);
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
            'source' => ['nullable', 'string', Rule::exists('lead_sources', 'slug')->where(fn ($query) => $query->where('status', 'active'))],
            'status' => ['required', 'string', Rule::exists('lead_statuses', 'slug')->where(fn ($query) => $query->where('status', 'active'))],
            'owner_id' => ['nullable', Rule::exists('users', 'id')],
            'interested_products' => ['nullable', 'array'],
            'interested_products.*' => ['integer', Rule::exists('products', 'id')],
            'next_follow_up_at' => ['nullable', 'date'],
            'notes' => ['nullable', 'string', 'max:10000'],
        ];
    }
}
