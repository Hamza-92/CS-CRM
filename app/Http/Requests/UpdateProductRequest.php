<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('product'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'brand_color' => ['nullable', 'string', 'regex:/^#[A-Fa-f0-9]{6}$/'],
            'code' => [
                'required', 'string', 'max:32', 'regex:/^[A-Za-z0-9\-_]+$/',
                Rule::unique('products', 'code')->ignore($this->route('product'))->withoutTrashed(),
            ],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['boolean'],
            'technical_owner_id' => ['nullable', Rule::exists('users', 'id')],
            'support_role_id' => ['nullable', Rule::exists('roles', 'id')],
            'default_trial_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'demo_notes' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'code.regex' => 'The code may only contain letters, numbers, hyphens and underscores.',
        ];
    }
}
