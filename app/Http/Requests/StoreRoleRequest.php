<?php

namespace App\Http\Requests;

use App\Enums\Permission as PermissionEnum;
use App\Enums\RoleName;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can(PermissionEnum::ManageRoles->value);
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['name' => Str::of((string) $this->input('name'))->trim()->snake()->toString()]);
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:64', 'regex:/^[a-z0-9]+(?:_[a-z0-9]+)*$/',
                Rule::unique('roles', 'name')->where(fn ($query) => $query->where('guard_name', 'web')),
                Rule::notIn(RoleName::values()),
            ],
            'permissions' => ['array'],
            'permissions.*' => ['string', Rule::in(PermissionEnum::values())],
        ];
    }
}
