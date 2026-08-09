<?php

namespace App\Services;

use App\Enums\RoleName;
use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Deal;
use App\Models\Lead;
use App\Models\Product;
use App\Models\User;

/**
 * Keeps ownership rules in one place so records created by different modules
 * follow the same routing policy.
 */
class AssignmentRouter
{
    public function forLead(array $data): ?User
    {
        return $this->explicit($data['owner_id'] ?? null)
            ?? $this->ownerFromLead($data['lead_id'] ?? null)
            ?? $this->ownerFromCustomer($data['customer_id'] ?? null)
            ?? $this->byRole(RoleName::Sales)
            ?? $this->byRole(RoleName::Admin)
            ?? $this->byRole(RoleName::SuperAdmin);
    }

    public function forCustomer(array $data): ?User
    {
        return $this->explicit($data['owner_id'] ?? null)
            ?? $this->byRole(RoleName::Sales)
            ?? $this->byRole(RoleName::Admin)
            ?? $this->byRole(RoleName::SuperAdmin);
    }

    public function forDeal(array $data): ?User
    {
        return $this->explicit($data['owner_id'] ?? null)
            ?? $this->ownerFromLead($data['lead_id'] ?? null)
            ?? $this->ownerFromCustomer($data['customer_id'] ?? null)
            ?? $this->byRole(RoleName::Sales)
            ?? $this->byRole(RoleName::Admin);
    }

    public function forFollowUp(array $data): ?User
    {
        return $this->explicit($data['owner_id'] ?? null)
            ?? $this->ownerFromLead($data['lead_id'] ?? null)
            ?? $this->ownerFromDeal($data['deal_id'] ?? null)
            ?? $this->ownerFromCustomer($data['customer_id'] ?? null)
            ?? $this->ownerFromInstance($data['application_instance_id'] ?? null)
            ?? $this->byRole(RoleName::Sales);
    }

    public function forSupportTicket(array $data): ?User
    {
        if ($assignee = $this->explicit($data['assigned_to_id'] ?? null)) {
            return $assignee;
        }

        $instance = ! empty($data['application_instance_id'])
            ? ApplicationInstance::query()->with(['product.supportRole', 'product.technicalOwner', 'owner', 'customer.owner'])->find($data['application_instance_id'])
            : null;

        if ($instance?->product?->supportRole) {
            $supportUser = User::query()->active()->role($instance->product->supportRole->name)->orderBy('id')->first();
            if ($supportUser) {
                return $supportUser;
            }
        }

        return $this->activeRelated($instance?->owner)
            ?? $this->activeRelated($instance?->product?->technicalOwner)
            ?? $this->activeRelated($instance?->customer?->owner)
            ?? $this->ownerFromCustomer($data['customer_id'] ?? null)
            ?? $this->byRole(RoleName::Support)
            ?? $this->byRole(RoleName::Admin);
    }

    public function forTask(array $data): ?User
    {
        if ($assignee = $this->explicit($data['assigned_to_id'] ?? null)) {
            return $assignee;
        }

        $product = ! empty($data['product_id']) ? Product::query()->with('technicalOwner')->find($data['product_id']) : null;
        if ($product?->technicalOwner && $product->technicalOwner->is_active) {
            return $product->technicalOwner;
        }

        return $this->ownerFromLead($data['lead_id'] ?? null)
            ?? $this->ownerFromCustomer($data['customer_id'] ?? null)
            ?? $this->byRole(RoleName::Developer)
            ?? $this->byRole(RoleName::Admin);
    }

    public function forDemoProduct(?Product $product): ?User
    {
        if ($product?->technical_owner_id && ($owner = $this->explicit($product->technical_owner_id))) {
            return $owner;
        }

        return $this->byRole(RoleName::Developer)
            ?? $this->byRole(RoleName::Admin);
    }

    private function explicit(mixed $id): ?User
    {
        return $id ? User::query()->active()->find((int) $id) : null;
    }

    private function ownerFromLead(mixed $id): ?User
    {
        return $this->activeRelated($id ? Lead::query()->with('owner')->find((int) $id)?->owner : null);
    }

    private function ownerFromDeal(mixed $id): ?User
    {
        return $this->activeRelated($id ? Deal::query()->with('owner')->find((int) $id)?->owner : null);
    }

    private function ownerFromCustomer(mixed $id): ?User
    {
        return $this->activeRelated($id ? Customer::query()->with('owner')->find((int) $id)?->owner : null);
    }

    private function ownerFromInstance(mixed $id): ?User
    {
        return $this->activeRelated($id ? ApplicationInstance::query()->with('owner')->find((int) $id)?->owner : null);
    }

    private function activeRelated(?User $user): ?User
    {
        return $user?->is_active ? $user : null;
    }

    private function byRole(RoleName $role): ?User
    {
        return User::query()->active()->role($role->value)->orderBy('id')->first();
    }
}
