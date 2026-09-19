<?php

use App\Models\Customer;
use App\Models\Plan;
use App\Models\Product;
use Inertia\Testing\AssertableInertia as Assert;

it('renders all one-page onboarding choices', function () {
    $product = Product::factory()->create(['name' => 'CounterPOS Grocery', 'is_active' => true]);
    $plan = Plan::factory()->create([
        'product_id' => $product->id,
        'name' => 'Annual Retail',
        'is_active' => true,
        'currency' => 'PKR',
    ]);

    $this->actingAs(superAdmin())
        ->get('/customers/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customers/create')
            ->where('products.0.id', $product->id)
            ->where('products.0.plans.0.id', $plan->id)
            ->where('can.create_instance', true)
            ->where('can.create_subscription', true)
            ->where('can.create_payment', true)
            ->has('defaults.starts_at')
            ->has('defaults.invoice_number'));
});

it('creates the complete customer workspace in one transaction', function () {
    $product = Product::factory()->create(['is_active' => true]);
    $plan = Plan::factory()->create([
        'product_id' => $product->id,
        'billing_cycle' => 'annual',
        'duration_days' => 365,
        'grace_days' => 7,
        'price' => 24000,
        'currency' => 'PKR',
        'is_active' => true,
    ]);

    $response = $this->actingAs(superAdmin())->post('/customers', [
        'name' => 'Hamza Retail',
        'business' => 'Hamza Grocery',
        'phone' => '03001234567',
        'whatsapp' => '',
        'email' => 'owner@example.test',
        'city' => 'Lahore',
        'source' => 'referral',
        'status' => 'active',
        'owner_id' => '',
        'tags' => ['grocery', 'priority'],
        'notes' => 'Created through onboarding.',
        'contacts' => [[
            'name' => 'Accounts Manager',
            'job_title' => 'Accounts',
            'email' => 'accounts@example.test',
            'phone' => '',
            'whatsapp' => '',
            'is_primary' => false,
            'notes' => '',
        ]],
        'application' => [
            'enabled' => true,
            'product_id' => $product->id,
            'name' => '',
            'environment' => 'production',
            'status' => 'planned',
            'domain' => 'hamza.counterpos.pk',
            'server_name' => '',
            'version' => '',
            'provisioning_template_code' => 'grocery',
            'notes' => '',
        ],
        'subscription' => [
            'enabled' => true,
            'plan_id' => $plan->id,
            'kind' => 'subscription',
            'status' => 'active',
            'starts_at' => '2026-09-20',
            'ends_at' => '',
            'renewal_at' => '',
            'grace_ends_at' => '',
            'auto_renew' => true,
            'external_reference' => 'CRM-CONTRACT-1',
            'notes' => '',
        ],
        'payment' => [
            'enabled' => true,
            'invoice_number' => 'INV-ONBOARD-001',
            'amount' => 24000,
            'currency' => 'PKR',
            'status' => 'paid',
            'method' => 'bank_transfer',
            'due_at' => '2026-09-20',
            'paid_at' => '',
            'reference' => 'TXN-001',
            'notes' => '',
        ],
    ]);

    $customer = Customer::query()->where('email', 'owner@example.test')->firstOrFail();
    $instance = $customer->instances()->firstOrFail();
    $subscription = $instance->subscriptions()->firstOrFail();
    $payment = $subscription->payments()->firstOrFail();

    $response->assertRedirect(route('customers.show', $customer));
    expect($customer->contacts()->firstOrFail()->is_primary)->toBeTrue()
        ->and($instance->name)->toBe('Hamza Grocery CounterPOS')
        ->and($instance->deployment_url)->toBe('https://hamza.counterpos.pk')
        ->and($instance->provisioning_template_code)->toBe('grocery')
        ->and($subscription->ends_at->toDateString())->toBe('2027-09-20')
        ->and($subscription->grace_ends_at->toDateString())->toBe('2027-09-27')
        ->and($payment->invoice_number)->toBe('INV-ONBOARD-001')
        ->and($payment->paid_at)->not->toBeNull();
});

it('rejects a plan from another product without creating a customer', function () {
    $product = Product::factory()->create(['is_active' => true]);
    $otherProduct = Product::factory()->create(['is_active' => true]);
    $plan = Plan::factory()->create(['product_id' => $otherProduct->id, 'is_active' => true]);

    $this->actingAs(superAdmin())->post('/customers', [
        'name' => 'Invalid Onboarding',
        'status' => 'active',
        'contacts' => [],
        'application' => [
            'enabled' => true,
            'product_id' => $product->id,
            'environment' => 'production',
            'status' => 'planned',
        ],
        'subscription' => [
            'enabled' => true,
            'plan_id' => $plan->id,
            'kind' => 'subscription',
            'status' => 'active',
            'starts_at' => today()->toDateString(),
            'auto_renew' => true,
        ],
        'payment' => ['enabled' => false],
    ])->assertSessionHasErrors('subscription.plan_id');

    expect(Customer::query()->where('name', 'Invalid Onboarding')->exists())->toBeFalse();
});
