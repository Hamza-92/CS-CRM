<?php

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Product;
use App\Models\TenantOperation;
use Illuminate\Support\Str;

it('links an application instance to CounterPOS and records tenant operations', function () {
    $customer = Customer::query()->create([
        'name' => 'Linked Customer',
        'status' => 'active',
    ]);
    $product = Product::factory()->create();
    $tenantId = (string) Str::uuid();

    $instance = ApplicationInstance::query()->create([
        'customer_id' => $customer->id,
        'product_id' => $product->id,
        'name' => 'Linked CounterPOS',
        'environment' => 'production',
        'status' => 'planned',
        'counterpos_tenant_id' => $tenantId,
        'counterpos_status' => 'provisioning',
        'counterpos_schema_version' => 12,
        'provisioning_template_code' => 'grocery',
        'provisioning_template_version' => 1,
    ]);

    $operation = $instance->tenantOperations()->create([
        'type' => 'migrate',
        'status' => 'queued',
        'idempotency_key' => (string) Str::uuid(),
        'request_payload' => ['target' => 'latest'],
    ]);

    $instance = $instance->fresh();

    expect($instance->counterpos_tenant_id)->toBe($tenantId)
        ->and($instance->counterpos_schema_version)->toBe(12)
        ->and($instance->provisioning_template_version)->toBe(1)
        ->and($instance->tenantOperations)->toHaveCount(1)
        ->and($operation->fresh()->request_payload)->toBe(['target' => 'latest'])
        ->and(TenantOperation::TYPES)->toContain('provision', 'migrate', 'seed_template');
});

it('leaves CounterPOS linkage nullable for existing-style instances', function () {
    $instance = ApplicationInstance::query()->create([
        'customer_id' => Customer::query()->create(['name' => 'Existing Customer', 'status' => 'active'])->id,
        'product_id' => Product::factory()->create()->id,
        'name' => 'Existing Instance',
        'environment' => 'production',
        'status' => 'active',
    ]);

    expect($instance->counterpos_tenant_id)->toBeNull()
        ->and($instance->counterpos_status)->toBeNull()
        ->and($instance->tenantOperations)->toHaveCount(0);
});