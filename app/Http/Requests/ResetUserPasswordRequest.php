<?php

namespace App\Http\Requests;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rules\Password;

class ResetUserPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('resetPassword', $this->route('user'));
    }

    protected function failedAuthorization(): void
    {
        $actor = $this->user();
        $target = $this->route('user');

        if ($actor?->is($target)) {
            throw new HttpResponseException(back()->with('error', 'You cannot reset your own password here.'));
        }

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
            'password' => ['required', 'string', 'confirmed', Password::defaults()],
        ];
    }
}
