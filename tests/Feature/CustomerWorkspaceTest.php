<?php

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Product;
use App\Models\Subscription;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

it('provides the customer workspace with operational, subscription, and payment summaries', function () {
    $customer = Customer::query()->create([
        'name' => 'Workspace Customer',
        'business' => 'Workspace Store',
        'status' => 'active',
    ]);
    $product = Product::factory()->create(['name' => 'CounterPOS Grocery']);
    $plan = Plan::factory()->create(['product_id' => $product->id, 'name' => 'Annual']);
    $instance = ApplicationInstance::query()->create([
        'customer_id' => $customer->id,
        'product_id' => $product->id,
        'name' => 'Workspace CounterPOS',
        'environment' => 'production',
        'status' => 'active',
        'deployment_url' => 'https://workspace.counterpos.pk',
        'version' => '2.1.0',
        'counterpos_tenant_id' => (string) Str::uuid(),
        'counterpos_status' => 'active',
        'counterpos_schema_version' => 17,
        'provisioning_template_code' => 'grocery',
    ]);
    $subscription = Subscription::query()->create([
        'application_instance_id' => $instance->id,
        'plan_id' => $plan->id,
        'kind' => 'subscription',
        'status' => 'active',
        'starts_at' => today(),
        'renewal_at' => today()->addYear(),
    ]);
    Payment::query()->create([
        'subscription_id' => $subscription->id,
        'invoice_number' => 'INV-WORKSPACE-001',
        'amount' => 25000,
        'currency' => 'PKR',
        'status' => 'pending',
        'due_at' => today()->addWeek(),
    ]);

    $this->actingAs(superAdmin())
        ->get("/customers/{$customer->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('customers/show')
            ->where('customer.instances.0.name', 'Workspace CounterPOS')
            ->where('customer.instances.0.counterpos_status', 'active')
            ->where('customer.instances.0.counterpos_schema_version', 17)
            ->where('customer.instances.0.subscriptions.0.status', 'active')
            ->where('customer.instances.0.subscriptions.0.payments.0.invoice_number', 'INV-WORKSPACE-001')
            ->where('customer.instances.0.subscriptions.0.payments.0.status', 'pending')
            ->where('can.create_instance', true)
            ->where('can.create_subscription', true)
            ->where('can.create_payment', true));
});
it('keeps the customer selected when opening workspace quick actions', function () {
    $customer = Customer::query()->create([
        'name' => 'Quick Action Customer',
        'status' => 'active',
    ]);
    $user = superAdmin();

    $this->actingAs($user)->get("/instances/create?customer_id={$customer->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('application-instances/create')->where('defaults.customer_id', $customer->id));

    $this->actingAs($user)->get("/support-tickets/create?customer_id={$customer->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('support-tickets/create')->where('defaults.customer_id', $customer->id));

    $this->actingAs($user)->get("/tasks/create?customer_id={$customer->id}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('tasks/create')->where('defaults.customer_id', $customer->id));
});
