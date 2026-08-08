<?php

namespace App\Http\Requests;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', User::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->withoutTrashed()],
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
            'job_title' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:32'],
            'is_active' => ['boolean'],
            'role' => ['required', 'string', Rule::in($this->assignableRoles())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return ['role' => 'role'];
    }

    /**
     * @return array<int, string>
     */
    protected function assignableRoles(): array
    {
        $roles = Role::query()->where('guard_name', 'web')->pluck('name')->all();

        if (! $this->user()->hasRole(RoleName::SuperAdmin->value)) {
            $roles = array_values(array_diff($roles, [RoleName::SuperAdmin->value]));
        }

        return $roles;
    }
}
