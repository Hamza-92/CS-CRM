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
        return $user->can(Permission::ManageProducts->value);
    }

    public function update(User $user, Product $product): bool
    {
        return $user->can(Permission::ManageProducts->value);
    }

    public function delete(User $user, Product $product): bool
    {
        return $user->can(Permission::ManageProducts->value);
    }

    public function restore(User $user, Product $product): bool
    {
        return $user->can(Permission::ManageProducts->value);
    }
}
