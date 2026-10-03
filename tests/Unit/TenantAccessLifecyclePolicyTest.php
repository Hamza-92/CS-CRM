<?php

namespace Tests\Unit;

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Subscription;
use App\Services\CounterPos\CounterPosClient;
use App\Services\CounterPos\CounterPosTenantService;
use App\Services\CounterPos\TenantAccessLifecycleService;
use Tests\TestCase;

class TenantAccessLifecyclePolicyTest extends TestCase
{
    private TenantAccessLifecycleService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new TenantAccessLifecycleService(
            new CounterPosTenantService(new CounterPosClient),
        );
    }

    public function test_it_does_not_manage_legacy_tenants_without_a_crm_subscription(): void
    {
        $this->assertNull($this->service->determineAccess(
            $this->makeInstance('active'),
            $this->makeCustomer('active'),
            null,
        ));
    }

    public function test_it_keeps_active_and_grace_period_subscriptions_accessible(): void
    {
        $active = $this->makeSubscription('active', today()->addMonth());
        $grace = $this->makeSubscription('past_due', today()->subDay(), today()->addDays(3));

        $this->assertSame('active', $this->decision($this->makeInstance(), $this->makeCustomer(), $active)['status']);
        $this->assertSame('active', $this->decision($this->makeInstance(), $this->makeCustomer(), $grace)['status']);
    }

    public function test_it_suspends_expired_and_archived_subscriptions_with_a_customer_facing_reason(): void
    {
        $expired = $this->makeSubscription('expired', today()->subMonth(), today()->subWeeks(3));
        $decision = $this->decision($this->makeInstance(), $this->makeCustomer(), $expired);

        $this->assertSame('suspended', $decision['status']);
        $this->assertStringContainsString('subscription has expired', $decision['reason']);

        $expired->deleted_at = now();
        $archived = $this->decision($this->makeInstance(), $this->makeCustomer(), $expired);

        $this->assertSame('suspended', $archived['status']);
        $this->assertStringContainsString('no longer active', $archived['reason']);
    }

    public function test_customer_and_instance_state_take_priority_over_subscription_state(): void
    {
        $subscription = $this->makeSubscription('active', today()->addMonth());

        $inactive = $this->decision($this->makeInstance(), $this->makeCustomer('inactive'), $subscription);
        $paused = $this->decision($this->makeInstance('paused'), $this->makeCustomer(), $subscription);
        $retired = $this->decision($this->makeInstance('retired'), $this->makeCustomer(), $subscription);
        $archivedCustomer = $this->makeCustomer();
        $archivedCustomer->deleted_at = now();
        $archived = $this->decision($this->makeInstance(), $archivedCustomer, $subscription);

        $this->assertSame('suspended', $inactive['status']);
        $this->assertSame('suspended', $paused['status']);
        $this->assertSame('archived', $retired['status']);
        $this->assertSame('archived', $archived['status']);
    }

    private function decision(ApplicationInstance $instance, Customer $customer, Subscription $subscription): array
    {
        return $this->service->determineAccess($instance, $customer, $subscription);
    }

    private function makeInstance(string $status = 'active'): ApplicationInstance
    {
        return new ApplicationInstance(['name' => 'Lifecycle CounterPOS', 'status' => $status]);
    }

    private function makeCustomer(string $status = 'active'): Customer
    {
        return new Customer(['name' => 'Lifecycle Customer', 'status' => $status]);
    }

    private function makeSubscription(string $status, $endsAt, $graceEndsAt = null): Subscription
    {
        return new Subscription([
            'status' => $status,
            'kind' => 'subscription',
            'starts_at' => today()->subMonth(),
            'ends_at' => $endsAt,
            'grace_ends_at' => $graceEndsAt,
        ]);
    }
}
