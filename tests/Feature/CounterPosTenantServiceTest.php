<?php

use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Product;
use App\Services\CounterPos\CounterPosTenantService;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.counterpos.base_url' => 'https://admin.counterpos.test/api/control/v1',
        'services.counterpos.key' => 'crm-test-key',
        'services.counterpos.secret' => 'crm-test-secret',
    ]);
});

it('links a CRM instance and never persists database credentials in its operation ledger', function () {
    $customer = Customer::query()->create(['name' => 'Provisioning Customer', 'status' => 'active']);
    $instance = ApplicationInstance::query()->create([
        'customer_id' => $customer->id,
        'product_id' => Product::factory()->create()->id,
        'name' => 'Provisioning Instance',
        'environment' => 'production',
        'status' => 'planned',
    ]);
    $tenantId = '53e80519-8f24-48a5-b747-c72d3c740977';

    Http::preventStrayRequests();
    Http::fake(function (Request $request) use ($instance, $tenantId) {
        if ($request->url() === 'https://admin.counterpos.test/api/control/v1/tenants') {
            return Http::response(['data' => [
                'id' => $tenantId,
                'crm_application_instance_id' => $instance->id,
                'status' => 'provisioning',
                'schema_version' => 0,
                'version' => 1,
                'data_template' => ['code' => 'grocery', 'version' => 1],
                'domain' => null,
            ]], 201);
        }

        expect($request->url())->toBe("https://admin.counterpos.test/api/control/v1/tenants/{$tenantId}/database")
            ->and($request->data()['password'])->toBe('SecretDatabasePassword123');

        return Http::response(['data' => [
            'id' => $tenantId,
            'crm_application_instance_id' => $instance->id,
            'status' => 'provisioning',
            'schema_version' => 0,
            'version' => 1,
            'data_template' => ['code' => 'grocery', 'version' => 1],
            'domain' => null,
            'database' => ['configured' => true, 'credential_version' => 1],
        ]]);
    });

    $service = app(CounterPosTenantService::class);
    $service->register($instance, [
        'name' => 'Provisioning Customer',
        'slug' => 'provisioning-customer',
        'data_template_code' => 'grocery',
        'data_template_version' => 1,
    ]);
    $service->configureDatabase($instance->fresh(), [
        'host' => 'localhost',
        'port' => 3306,
        'database_name' => 'customer_provisioning',
        'username' => 'customer_user',
        'password' => 'SecretDatabasePassword123',
    ]);

    $instance = $instance->fresh();
    $databaseOperation = $instance->tenantOperations()->where('type', 'configure_database')->firstOrFail();
    $persistedOperations = json_encode($instance->tenantOperations()->get()->toArray());

    expect($instance->counterpos_tenant_id)->toBe($tenantId)
        ->and($instance->provisioning_template_code)->toBe('grocery')
        ->and($databaseOperation->request_payload)->toBe(['credentials_provided' => true])
        ->and($persistedOperations)->not->toContain('SecretDatabasePassword123');
});
