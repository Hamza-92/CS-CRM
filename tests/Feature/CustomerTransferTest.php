<?php

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Plan;
use App\Models\Product;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    config()->set('services.counterpos.base_url', 'https://admin.counterpos.test/api/control/v1');
    config()->set('services.counterpos.key', 'crm-test');
    config()->set('services.counterpos.secret', 'test-secret');
});

it('lists CounterPOS tenants and pre-fills a transfer form', function () {
    $tenantId = (string) Str::uuid();
    $tenant = [
        'id' => $tenantId,
        'business_name' => 'Legacy Shop',
        'customer_name' => 'Shop Owner',
        'email' => 'owner@example.test',
        'phone' => '03001234567',
        'status' => 'active',
        'url' => 'https://legacy.counterpos.pk',
        'database' => 'legacy_shop_db',
        'crm_application_instance_id' => null,
    ];
    Http::fake([
        '*/tenants?*' => Http::response(['data' => [$tenant], 'meta' => ['current_page' => 1, 'last_page' => 1, 'total' => 1]]),
        "*/tenants/{$tenantId}" => Http::response(['data' => $tenant]),
    ]);
    Product::factory()->create(['is_active' => true]);

    $this->actingAs(superAdmin())->get('/customer-transfers')->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('customer-transfers/index')->where('tenants.0.id', $tenantId));
    $this->actingAs(superAdmin())->get("/customer-transfers/{$tenantId}/create")->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('customer-transfers/create')->where('tenant.customer_name', 'Shop Owner'));
});

it('requires date confirmation and links the existing tenant after saving the CRM subscription', function () {
    $tenantId = (string) Str::uuid();
    $tenant = [
        'id' => $tenantId, 'business_name' => 'Legacy Shop', 'customer_name' => 'Shop Owner',
        'email' => 'owner@example.test', 'phone' => null, 'status' => 'active',
        'url' => 'https://legacy.counterpos.pk', 'database' => 'legacy_shop_db',
        'crm_application_instance_id' => null,
    ];
    Http::fake(function (Request $request) use ($tenant) {
        if ($request->method() === 'GET') {
            return Http::response(['data' => $tenant]);
        }

        return Http::response(['data' => [...$tenant, 'crm_application_instance_id' => $request['crm_application_instance_id']]]);
    });
    $product = Product::factory()->create(['is_active' => true]);
    $plan = Plan::factory()->create(['product_id' => $product->id, 'billing_cycle' => 'annual', 'is_active' => true]);
    $start = today()->subWeek()->toDateString();
    $end = today()->addYear()->toDateString();
    $payload = [
        'tenant_id' => $tenantId,
        'name' => 'Shop Owner', 'business' => 'Legacy Shop', 'email' => 'owner@example.test', 'phone' => '',
        'customer_status' => 'active', 'product_id' => $product->id,
        'instance_name' => 'Legacy Shop CounterPOS', 'environment' => 'production', 'instance_status' => 'active',
        'plan_id' => $plan->id, 'subscription_status' => 'active',
        'starts_at' => $start, 'ends_at' => $end, 'auto_renew' => false,
    ];

    $this->actingAs(superAdmin())->post('/customer-transfers', $payload)->assertSessionHasErrors('dates_confirmed');
    expect(Customer::query()->where('business', 'Legacy Shop')->exists())->toBeFalse();

    $this->actingAs(superAdmin())->post('/customer-transfers', [
        ...$payload,
        'starts_at' => today()->addDay()->toDateString(),
        'ends_at' => today()->addYear()->toDateString(),
        'dates_confirmed' => true,
    ])->assertSessionHasErrors('starts_at');
    expect(Customer::query()->where('business', 'Legacy Shop')->exists())->toBeFalse();

    $this->actingAs(superAdmin())->post('/customer-transfers', [...$payload, 'dates_confirmed' => true])
        ->assertSessionHas('success');

    $customer = Customer::query()->where('business', 'Legacy Shop')->firstOrFail();
    $instance = ApplicationInstance::query()->where('counterpos_tenant_id', $tenantId)->firstOrFail();
    expect($instance->customer_id)->toBe($customer->id)
        ->and($instance->deployment_url)->toBe('https://legacy.counterpos.pk')
        ->and($instance->subscriptions()->firstOrFail()->starts_at->toDateString())->toBe($start)
        ->and($instance->subscriptions()->firstOrFail()->ends_at->toDateString())->toBe($end);
    Http::assertSent(fn (Request $request) => $request->method() === 'PUT'
        && str_ends_with($request->url(), "/tenants/{$tenantId}/crm-link")
        && (int) $request['crm_application_instance_id'] === $instance->id);
});

it('keeps the same CRM instance available when the remote link needs a retry', function () {
    $tenantId = (string) Str::uuid();
    $tenant = [
        'id' => $tenantId, 'business_name' => 'Retry Shop', 'customer_name' => 'Owner',
        'email' => null, 'phone' => null, 'status' => 'active',
        'url' => 'https://retry.counterpos.pk', 'database' => 'retry_db',
        'crm_application_instance_id' => null,
    ];
    $linkAttempts = 0;
    Http::fake(function (Request $request) use ($tenant, &$linkAttempts) {
        if ($request->method() === 'GET') {
            return Http::response(['data' => $tenant]);
        }
        $linkAttempts++;

        return $linkAttempts === 1
            ? Http::response(['message' => 'Temporarily unavailable'], 503)
            : Http::response(['data' => [...$tenant, 'crm_application_instance_id' => $request['crm_application_instance_id']]]);
    });
    $product = Product::factory()->create(['is_active' => true]);
    $plan = Plan::factory()->create(['product_id' => $product->id, 'is_active' => true]);
    $this->actingAs(superAdmin())->post('/customer-transfers', [
        'tenant_id' => $tenantId, 'name' => 'Owner', 'business' => 'Retry Shop',
        'customer_status' => 'active', 'product_id' => $product->id,
        'instance_name' => 'Retry Shop CounterPOS', 'environment' => 'production', 'instance_status' => 'active',
        'plan_id' => $plan->id, 'subscription_status' => 'active',
        'starts_at' => today()->toDateString(), 'ends_at' => today()->addYear()->toDateString(),
        'auto_renew' => false, 'dates_confirmed' => true,
    ])->assertSessionHas('error');

    $instance = ApplicationInstance::query()->where('counterpos_tenant_id', $tenantId)->firstOrFail();
    $this->actingAs(superAdmin())->post("/customer-transfers/{$instance->id}/retry-link")
        ->assertSessionHas('success');
    expect($linkAttempts)->toBe(2)
        ->and(ApplicationInstance::query()->where('counterpos_tenant_id', $tenantId)->count())->toBe(1);
});

it('can attach a tenant to an existing CRM customer without changing that customer status', function () {
    $tenantId = (string) Str::uuid();
    $tenant = [
        'id' => $tenantId, 'business_name' => 'Existing Shop', 'customer_name' => 'Owner',
        'email' => null, 'phone' => null, 'status' => 'suspended',
        'url' => 'https://existing.counterpos.pk', 'database' => 'existing_db',
        'crm_application_instance_id' => null,
    ];
    Http::fake(fn (Request $request) => Http::response(['data' => $tenant]));
    $customer = Customer::query()->create(['name' => 'Old Name', 'status' => 'inactive']);
    $product = Product::factory()->create(['is_active' => true]);
    $plan = Plan::factory()->create(['product_id' => $product->id, 'is_active' => true]);
    $payload = [
        'tenant_id' => $tenantId, 'existing_customer_id' => $customer->id,
        'name' => 'Owner', 'business' => 'Existing Shop', 'customer_status' => 'inactive',
        'product_id' => $product->id, 'instance_name' => 'Existing Shop CounterPOS',
        'environment' => 'production', 'instance_status' => 'paused',
        'plan_id' => $plan->id, 'subscription_status' => 'paused',
        'starts_at' => today()->subMonth()->toDateString(), 'ends_at' => today()->addMonth()->toDateString(),
        'auto_renew' => false, 'dates_confirmed' => true,
    ];
    $this->actingAs(superAdmin())->post('/customer-transfers', [...$payload, 'customer_status' => 'active'])
        ->assertSessionHasErrors('customer_status');
    $this->actingAs(superAdmin())->post('/customer-transfers', $payload)->assertSessionHas('success');

    expect($customer->fresh()->name)->toBe('Owner')
        ->and($customer->fresh()->status)->toBe('inactive')
        ->and($customer->instances()->where('counterpos_tenant_id', $tenantId)->exists())->toBeTrue()
        ->and(Customer::query()->count())->toBe(1);
});
