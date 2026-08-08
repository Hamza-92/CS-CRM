<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Subscription;
use App\Models\User;

class SubscriptionPolicy
{
    public function viewAny(User $user): bool { return $this->any($user, Permission::ViewSubscriptions, Permission::ManageSubscriptions); }
    public function view(User $user, Subscription $subscription): bool { return $this->any($user, Permission::ViewSubscriptions, Permission::ManageSubscriptions); }
    public function create(User $user): bool { return $this->any($user, Permission::CreateSubscriptions, Permission::ManageSubscriptions); }
    public function update(User $user, Subscription $subscription): bool { return $this->any($user, Permission::EditSubscriptions, Permission::ManageSubscriptions); }
    public function delete(User $user, Subscription $subscription): bool { return $this->any($user, Permission::ArchiveSubscriptions, Permission::ManageSubscriptions); }
    public function restore(User $user, Subscription $subscription): bool { return $this->any($user, Permission::ArchiveSubscriptions, Permission::ManageSubscriptions); }
    private function any(User $user, Permission ...$permissions): bool { return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value)); }
}
