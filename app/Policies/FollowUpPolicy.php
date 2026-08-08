<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\FollowUp;
use App\Models\User;

class FollowUpPolicy
{
    public function viewAny(User $user): bool { return $this->canAny($user, Permission::ViewFollowUps, Permission::ManageFollowUps); }
    public function view(User $user, FollowUp $followUp): bool { return $this->canAny($user, Permission::ViewFollowUps, Permission::ManageFollowUps); }
    public function create(User $user): bool { return $this->canAny($user, Permission::CreateFollowUps, Permission::ManageFollowUps); }
    public function update(User $user, FollowUp $followUp): bool { return $this->canAny($user, Permission::EditFollowUps, Permission::ManageFollowUps); }
    public function delete(User $user, FollowUp $followUp): bool { return $this->canAny($user, Permission::DeleteFollowUps, Permission::ManageFollowUps); }
    public function complete(User $user, FollowUp $followUp): bool { return $this->canAny($user, Permission::CompleteFollowUps, Permission::ManageFollowUps); }

    private function canAny(User $user, Permission ...$permissions): bool
    {
        return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value));
    }
}
