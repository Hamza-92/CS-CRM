<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Payment;
use App\Models\User;

class PaymentPolicy
{
    public function viewAny(User $user): bool { return $this->any($user, Permission::ViewPayments, Permission::ManagePayments); }
    public function view(User $user, Payment $payment): bool { return $this->any($user, Permission::ViewPayments, Permission::ManagePayments); }
    public function create(User $user): bool { return $this->any($user, Permission::CreatePayments, Permission::ManagePayments); }
    public function update(User $user, Payment $payment): bool { return $this->any($user, Permission::EditPayments, Permission::ManagePayments); }
    public function delete(User $user, Payment $payment): bool { return $this->any($user, Permission::ArchivePayments, Permission::ManagePayments); }
    public function restore(User $user, Payment $payment): bool { return $this->any($user, Permission::ArchivePayments, Permission::ManagePayments); }
    private function any(User $user, Permission ...$permissions): bool { return collect($permissions)->contains(fn (Permission $permission) => $user->can($permission->value)); }
}
