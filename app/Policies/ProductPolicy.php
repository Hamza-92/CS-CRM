<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::ViewProducts->value);
    }

    public function view(User $user, Product $product): bool
    {
        return $user->can(Permission::ViewProducts->value);
    }

    public function create(User $user): bool
    {
        return $this->canAny($user, Permission::CreateProducts, Permission::ManageProducts);
    }

    public function update(User $user, Product $product): bool
    {
        return $this->canAny($user, Permission::EditProducts, Permission::ManageProducts);
    }

    public function delete(User $user, Product $product): bool
    {
        return $this->canAny($user, Permission::ArchiveProducts, Permission::ManageProducts);
    }

    public function restore(User $user, Product $product): bool
    {
        return $this->canAny($user, Permission::ArchiveProducts, Permission::ManageProducts);
    }

    private function canAny(User $user, Permission ...$permissions): bool
    {
        return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value));
    }
}
