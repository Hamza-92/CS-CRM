<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\User;
use App\Models\WorkTask;

class WorkTaskPolicy
{
    public function viewAny(User $user): bool { return $this->any($user, Permission::ViewTasks, Permission::ManageTasks); }
    public function view(User $user, WorkTask $task): bool { return $this->any($user, Permission::ViewTasks, Permission::ManageTasks); }
    public function create(User $user): bool { return $this->any($user, Permission::CreateTasks, Permission::ManageTasks); }
    public function update(User $user, WorkTask $task): bool { return $this->any($user, Permission::EditTasks, Permission::ManageTasks); }
    public function delete(User $user, WorkTask $task): bool { return $this->any($user, Permission::ArchiveTasks, Permission::ManageTasks); }
    public function restore(User $user, WorkTask $task): bool { return $this->any($user, Permission::ArchiveTasks, Permission::ManageTasks); }
    private function any(User $user, Permission ...$permissions): bool { return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value)); }
}
