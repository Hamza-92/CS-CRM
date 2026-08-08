<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Deal;
use App\Models\User;

class DealPolicy
{
    public function viewAny(User $user): bool { return $this->canAny($user, Permission::ViewDeals, Permission::ManageDeals); }
    public function view(User $user, Deal $deal): bool { return $this->canAny($user, Permission::ViewDeals, Permission::ManageDeals); }
    public function create(User $user): bool { return $this->canAny($user, Permission::CreateDeals, Permission::ManageDeals); }
    public function update(User $user, Deal $deal): bool { return $this->canAny($user, Permission::EditDeals, Permission::ManageDeals); }
    public function delete(User $user, Deal $deal): bool { return $this->canAny($user, Permission::ArchiveDeals, Permission::ManageDeals); }
    public function restore(User $user, Deal $deal): bool { return $this->canAny($user, Permission::ArchiveDeals, Permission::ManageDeals); }

    private function canAny(User $user, Permission ...$permissions): bool
    {
        return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value));
    }
}
