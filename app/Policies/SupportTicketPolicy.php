<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\SupportTicket;
use App\Models\User;

class SupportTicketPolicy
{
    public function viewAny(User $user): bool { return $this->any($user, Permission::ViewSupportTickets, Permission::ManageSupportTickets); }
    public function view(User $user, SupportTicket $ticket): bool { return $this->any($user, Permission::ViewSupportTickets, Permission::ManageSupportTickets); }
    public function create(User $user): bool { return $this->any($user, Permission::CreateSupportTickets, Permission::ManageSupportTickets); }
    public function update(User $user, SupportTicket $ticket): bool { return $this->any($user, Permission::EditSupportTickets, Permission::ManageSupportTickets); }
    public function delete(User $user, SupportTicket $ticket): bool { return $this->any($user, Permission::ArchiveSupportTickets, Permission::ManageSupportTickets); }
    public function restore(User $user, SupportTicket $ticket): bool { return $this->any($user, Permission::ArchiveSupportTickets, Permission::ManageSupportTickets); }
    private function any(User $user, Permission ...$permissions): bool { return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value)); }
}
