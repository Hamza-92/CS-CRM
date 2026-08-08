<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Customer;
use App\Models\User;

class CustomerPolicy
{
    public function viewAny(User $user): bool { return $user->can(Permission::ViewCustomers->value); }
    public function view(User $user, Customer $customer): bool { return $user->can(Permission::ViewCustomers->value); }
    public function create(User $user): bool { return $this->canAny($user, Permission::CreateCustomers, Permission::ManageCustomers); }
    public function update(User $user, Customer $customer): bool { return $this->canAny($user, Permission::EditCustomers, Permission::ManageCustomers); }
    public function delete(User $user, Customer $customer): bool { return $this->canAny($user, Permission::ArchiveCustomers, Permission::ManageCustomers); }
    public function restore(User $user, Customer $customer): bool { return $this->canAny($user, Permission::ArchiveCustomers, Permission::ManageCustomers); }

    private function canAny(User $user, Permission ...$permissions): bool
    {
        return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value));
    }
}
