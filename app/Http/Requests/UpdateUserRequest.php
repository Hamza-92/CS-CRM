<?php

namespace App\Http\Requests;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('user'));
    }

    protected function failedAuthorization(): void
    {
        $actor = $this->user();
        $target = $this->route('user');

        if ($target instanceof User && $target->hasRole(RoleName::SuperAdmin->value) && ! $actor?->hasRole(RoleName::SuperAdmin->value)) {
            throw new HttpResponseException(back()->with('error', 'The Super Admin account is protected.'));
        }

        parent::failedAuthorization();
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
        $roles = Role::query()->where('guard_name', 'web')->pluck('name')->all();

        if (! $this->user()->hasRole(RoleName::SuperAdmin->value)) {
            $roles = array_values(array_diff($roles, [RoleName::SuperAdmin->value]));
        }

        return $roles;
    }
}
