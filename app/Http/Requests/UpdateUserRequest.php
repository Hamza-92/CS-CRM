<?php

namespace App\Http\Requests;

use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('user'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($this->route('user'))->withoutTrashed(),
            ],
            'job_title' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'role' => ['required', 'string', Rule::in($this->assignableRoles())],
        ];
    }

    /**
     * @return array<int, string>
     */
    protected function assignableRoles(): array
    {
        $roles = RoleName::values();

        if (! $this->user()->hasRole(RoleName::SuperAdmin->value)) {
            $roles = array_values(array_diff($roles, [RoleName::SuperAdmin->value]));
        }

        return $roles;
    }
}
