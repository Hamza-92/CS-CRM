<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Enums\RoleName;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::ViewUsers->value);
    }

    public function view(User $user, User $target): bool
    {
        return $user->can(Permission::ViewUsers->value);
    }

    public function create(User $user): bool
    {
        return $this->canAny($user, Permission::CreateUsers, Permission::ManageUsers);
    }

    public function update(User $user, User $target): bool
    {
        if ($this->isProtected($user, $target)) {
            return false;
        }

        return $this->canAny($user, Permission::EditUsers, Permission::ManageUsers);
    }

    public function resetPassword(User $user, User $target): bool
    {
        return ! $this->isProtected($user, $target)
            && ! $user->is($target)
            && $this->canAny($user, Permission::ResetUserPasswords, Permission::ManageUsers);
    }

    public function toggleStatus(User $user, User $target): bool
    {
        if ($user->is($target)) {
            return false;
        }

        return ! $this->isProtected($user, $target)
            && ! $user->is($target)
            && $this->canAny($user, Permission::ChangeUserStatus, Permission::ManageUsers);
    }

    public function delete(User $user, User $target): bool
    {
        if ($user->is($target)) {
            return false;
        }

        return ! $this->isProtected($user, $target)
            && ! $user->is($target)
            && $this->canAny($user, Permission::DeleteUsers, Permission::ManageUsers);
    }

    public function assignRoles(User $user, User $target): bool
    {
        if ($this->isProtected($user, $target)) {
            return false;
        }

        return $user->can(Permission::ManageRoles->value);
    }

    protected function isProtected(User $user, User $target): bool
    {
        return $target->hasRole(RoleName::SuperAdmin->value)
            && ! $user->hasRole(RoleName::SuperAdmin->value);
    }

    private function canAny(User $user, Permission ...$permissions): bool
    {
        return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value));
    }
}
