<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    public function viewAny(User $user): bool { return $user->can(Permission::ViewLeads->value); }
    public function view(User $user, Lead $lead): bool { return $user->can(Permission::ViewLeads->value); }
    public function create(User $user): bool { return $this->canAny($user, Permission::CreateLeads, Permission::ManageLeads); }
    public function update(User $user, Lead $lead): bool { return $this->canAny($user, Permission::EditLeads, Permission::ManageLeads); }
    public function delete(User $user, Lead $lead): bool { return $this->canAny($user, Permission::ArchiveLeads, Permission::ManageLeads); }
    public function restore(User $user, Lead $lead): bool { return $this->canAny($user, Permission::ArchiveLeads, Permission::ManageLeads); }
    public function convert(User $user, Lead $lead): bool { return $this->canAny($user, Permission::ConvertLeads, Permission::ManageLeads); }

    private function canAny(User $user, Permission ...$permissions): bool
    {
        return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value));
    }
}
