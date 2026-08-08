<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Plan;
use App\Models\User;

class PlanPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::ViewPlans->value);
    }

    public function view(User $user, Plan $plan): bool
    {
        return $user->can(Permission::ViewPlans->value);
    }

    public function viewPricing(User $user): bool
    {
        return $user->can(Permission::ViewPlanPricing->value);
    }

    public function create(User $user): bool
    {
        return $user->can(Permission::ManagePlans->value);
    }

    public function update(User $user, Plan $plan): bool
    {
        return $user->can(Permission::ManagePlans->value);
    }

    public function delete(User $user, Plan $plan): bool
    {
        return $user->can(Permission::ManagePlans->value);
    }

    public function restore(User $user, Plan $plan): bool
    {
        return $user->can(Permission::ManagePlans->value);
    }
}
