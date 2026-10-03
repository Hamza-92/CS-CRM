<?php

namespace App\Services\CounterPos;

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Subscription;
use App\Models\TenantOperation;
use App\Models\User;
use Illuminate\Support\Str;

final class TenantAccessLifecycleService
{
    public function __construct(private readonly CounterPosTenantService $counterPos) {}

    public function sync(ApplicationInstance $instance, ?User $requestedBy = null): ?TenantOperation
    {
        $instance = ApplicationInstance::withTrashed()->findOrFail($instance->getKey());

        if (! Str::isUuid((string) $instance->counterpos_tenant_id)) {
            return null;
        }

        $desired = $this->desiredAccess($instance);
        if ($desired === null) {
            return null;
        }

        $response = $this->counterPos->refresh($instance);
        $tenant = is_array($response['data'] ?? null) ? $response['data'] : [];
        $currentStatus = (string) ($tenant['status'] ?? '');
        $currentReason = (string) ($tenant['access_reason'] ?? '');

        if ($currentStatus === $desired['status']
            && ($desired['status'] === 'active' || hash_equals($currentReason, $desired['reason']))) {
            return null;
        }

        return $this->counterPos->changeStatus(
            $instance,
            $desired['status'],
            (int) ($tenant['version'] ?? 0),
            $desired['status'] === 'active' ? null : $desired['reason'],
            $requestedBy,
        );
    }

    public function archive(ApplicationInstance $instance, string $reason, ?User $requestedBy = null): ?TenantOperation
    {
        return $this->apply($instance, 'archived', $reason, $requestedBy);
    }

    public function suspend(ApplicationInstance $instance, string $reason, ?User $requestedBy = null): ?TenantOperation
    {
        return $this->apply($instance, 'suspended', $reason, $requestedBy);
    }

    /** @return array{status: string, reason: string}|null */
    public function desiredAccess(ApplicationInstance $instance): ?array
    {
        $customer = $instance->customer()->withTrashed()->first();
        $subscription = $instance->subscriptions()
            ->withTrashed()
            ->orderByDesc('starts_at')
            ->orderByDesc('id')
            ->first();

        return $this->determineAccess($instance, $customer, $subscription);
    }

    /** @return array{status: string, reason: string}|null */
    public function determineAccess(ApplicationInstance $instance, ?Customer $customer, ?Subscription $subscription): ?array
    {
        if ($instance->trashed() || $instance->status === 'retired') {
            return ['status' => 'archived', 'reason' => 'This Counter POS tenant has been retired. Please contact the Counter POS support team if you need access restored.'];
        }

        if ($customer === null || $customer->trashed()) {
            return ['status' => 'archived', 'reason' => 'This customer account has been archived. Please contact the Counter POS support team if you need access restored.'];
        }

        if ($customer->status !== 'active') {
            return ['status' => 'suspended', 'reason' => 'This customer account is currently inactive. Please contact the Counter POS support team to restore access.'];
        }

        if ($instance->status === 'paused') {
            return ['status' => 'suspended', 'reason' => 'This Counter POS service has been temporarily paused. Please contact the Counter POS support team for assistance.'];
        }

        if ($instance->status !== 'active') {
            return null;
        }

        if ($subscription === null) {
            return null;
        }

        if (! $subscription->trashed() && $this->subscriptionHasAccess($subscription)) {
            return ['status' => 'active', 'reason' => ''];
        }

        $reason = match (true) {
            $subscription->trashed() => 'Your Counter POS subscription is no longer active. Please contact the Counter POS support team to restore access.',
            $subscription->status === 'cancelled' => 'Your Counter POS subscription has been cancelled. Please contact the Counter POS support team to reactivate your service.',
            $subscription->status === 'paused' => 'Your Counter POS subscription is currently paused. Please contact the Counter POS support team to restore access.',
            default => 'Your Counter POS subscription has expired. Please contact the Counter POS support team to renew your service.',
        };

        return ['status' => 'suspended', 'reason' => $reason];
    }

    private function apply(ApplicationInstance $instance, string $status, string $reason, ?User $requestedBy): ?TenantOperation
    {
        if (! Str::isUuid((string) $instance->counterpos_tenant_id)) {
            return null;
        }

        $response = $this->counterPos->refresh($instance);
        $tenant = is_array($response['data'] ?? null) ? $response['data'] : [];
        $currentStatus = (string) ($tenant['status'] ?? '');
        $currentReason = (string) ($tenant['access_reason'] ?? '');

        if ($currentStatus === $status && hash_equals($currentReason, $reason)) {
            return null;
        }

        return $this->counterPos->changeStatus(
            $instance,
            $status,
            (int) ($tenant['version'] ?? 0),
            $reason,
            $requestedBy,
        );
    }

    private function subscriptionHasAccess(Subscription $subscription): bool
    {
        if (! in_array($subscription->status, ['trialing', 'active', 'past_due'], true)) {
            return false;
        }

        if ($subscription->ends_at === null || $subscription->ends_at->greaterThanOrEqualTo(today())) {
            return true;
        }

        return $subscription->grace_ends_at?->greaterThanOrEqualTo(today()) === true;
    }
}
