<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\ApplicationInstance;
use App\Models\User;

class ApplicationInstancePolicy
{
    public function viewAny(User $user): bool { return $user->can(Permission::ViewInstances->value); }
    public function view(User $user, ApplicationInstance $instance): bool { return $user->can(Permission::ViewInstances->value); }
    public function create(User $user): bool { return $this->any($user, Permission::CreateInstances, Permission::ManageInstances); }
    public function update(User $user, ApplicationInstance $instance): bool { return $this->any($user, Permission::EditInstances, Permission::ManageInstances); }
    public function delete(User $user, ApplicationInstance $instance): bool { return $this->any($user, Permission::ArchiveInstances, Permission::ManageInstances); }
    public function restore(User $user, ApplicationInstance $instance): bool { return $this->any($user, Permission::ArchiveInstances, Permission::ManageInstances); }
    private function any(User $user, Permission ...$permissions): bool { return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value)); }
}
