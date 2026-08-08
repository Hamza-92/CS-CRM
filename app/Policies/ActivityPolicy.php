<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Activity;
use App\Models\User;

class ActivityPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can(Permission::ViewActivityLog->value);
    }

    public function view(User $user, Activity $activity): bool
    {
        return $user->can(Permission::ViewActivityLog->value);
    }

    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, Activity $activity): bool
    {
        return false;
    }

    public function delete(User $user, Activity $activity): bool
    {
        return false;
    }
}
