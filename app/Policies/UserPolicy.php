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
        return $user->can(Permission::ManageUsers->value);
    }

    public function update(User $user, User $target): bool
    {
        if ($this->isProtected($user, $target)) {
            return false;
        }

        return $user->can(Permission::ManageUsers->value);
    }

    public function resetPassword(User $user, User $target): bool
    {
        return $this->update($user, $target);
    }

    public function toggleStatus(User $user, User $target): bool
    {
        if ($user->is($target)) {
            return false;
        }

        return $this->update($user, $target);
    }

    public function delete(User $user, User $target): bool
    {
        if ($user->is($target)) {
            return false;
        }

        return $this->update($user, $target);
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
}
