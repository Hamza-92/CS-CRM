<?php

use App\Jobs\ProvisionTenant;
use App\Models\ApplicationInstance;
use App\Models\Customer;
use App\Models\Product;
use App\Services\TenantProvisioningWorkflow;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;

function provisioningAdministrator(): array
{
    return [
        'admin_name' => 'Provisioning Store',
        'admin_email' => 'owner@example.test',
        'password' => 'SecureTenantPassword123!',
        'password_confirmation' => 'SecureTenantPassword123!',
    ];
}

function provisioningInstance(): ApplicationInstance
{
    $customer = Customer::query()->create([
        'name' => 'Provisioning Owner',
        'business' => 'Provisioning Store',
        'email' => 'owner@example.test',
        'phone' => '03001234567',
        'status' => 'active',
    ]);

    return ApplicationInstance::query()->create([
        'customer_id' => $customer->id,
        'product_id' => Product::factory()->create()->id,
        'name' => 'Provisioning CounterPOS',
        'environment' => 'production',
        'status' => 'planned',
        'deployment_url' => 'https://provisioning.counterpos.pk',
        'provisioning_template_code' => 'grocery',
        'provisioning_template_version' => 1,
    ]);
}

beforeEach(function () {
    config([
        'services.hostinger.base_url' => 'https://developers.hostinger.test',
        'services.hostinger.token' => 'hostinger-token',
        'services.hostinger.account_username' => 'u123456789',
        'services.hostinger.hosting_order_id' => 987,
        'services.hostinger.parent_domain' => 'counterpos.pk',
        'services.hostinger.subdomain_directory' => 'public',
        'services.hostinger.database_prefix' => 'prod_cp',
        'services.hostinger.database_host' => 'mysql.hostinger.test',
        'services.hostinger.database_port' => 3306,
        'services.hostinger.database_remote_ip' => '203.0.113.10',
        'services.counterpos.base_url' => 'https://admin.counterpos.test/api/control/v1',
        'services.counterpos.key' => 'crm-key',
        'services.counterpos.secret' => 'crm-secret',
    ]);
});

it('queues a single provisioning run from the customer workspace', function () {
    Queue::fake();
    $instance = provisioningInstance();

    $this->actingAs(superAdmin())
        ->post("/instances/{$instance->id}/provisioning", provisioningAdministrator())
        ->assertRedirect();

    $run = $instance->tenantOperations()->where('type', 'provision')->firstOrFail();
    expect($run->status)->toBe('queued')
        ->and($run->result['steps'])->toHaveCount(12)
        ->and($run->request_payload)->not->toHaveKey('password');

    Queue::assertPushed(ProvisionTenant::class, fn (ProvisionTenant $job) => $job->operationId === $run->id
        && $job->administrator['email'] === 'owner@example.test');

    $this->actingAs(superAdmin())
        ->post("/instances/{$instance->id}/provisioning")
        ->assertRedirect();

    expect($instance->tenantOperations()->where('type', 'provision')->count())->toBe(1);
});

it('marks a failed setup as queued before resuming from its failed step', function () {
    Queue::fake();
    $instance = provisioningInstance();
    $result = TenantProvisioningWorkflow::initialResult();
    $result['steps'][2]['status'] = 'failed';
    $result['steps'][2]['message'] = 'Database creation failed.';
    $run = $instance->tenantOperations()->create([
        'requested_by_id' => superAdmin()->id,
        'type' => 'provision',
        'status' => 'failed',
        'idempotency_key' => (string) Str::uuid(),
        'result' => $result,
        'error_code' => 'hostinger_api_exception',
        'error_message' => 'Database creation failed.',
        'finished_at' => now(),
    ]);

    $this->actingAs(superAdmin())
        ->post("/instances/{$instance->id}/provisioning/resume", provisioningAdministrator())
        ->assertRedirect();

    expect($run->fresh()->status)->toBe('queued')
        ->and($run->fresh()->error_message)->toBeNull();
    Queue::assertPushed(ProvisionTenant::class, fn (ProvisionTenant $job) => $job->operationId === $run->id
        && $job->fromStep === 'create_database');
});

it('updates a tenant administrator without persisting the password', function () {
    $instance = provisioningInstance();
    $instance->forceFill(['counterpos_tenant_id' => (string) Str::uuid()])->save();

    Http::preventStrayRequests();
    Http::fake(fn (Request $request) => Http::response(['data' => [
        'id' => (string) Str::uuid(),
        'tenant_id' => $instance->counterpos_tenant_id,
        'type' => 'configure-administrator',
        'status' => 'succeeded',
        'result' => ['admin_email' => 'owner@example.test', 'created' => false],
    ]]));

    $this->actingAs(superAdmin())
        ->put("/instances/{$instance->id}/administrator", provisioningAdministrator())
        ->assertRedirect();

    $operation = $instance->tenantOperations()->where('type', 'configure_administrator')->firstOrFail();
    $ledger = json_encode($operation->toArray());

    expect($operation->status)->toBe('succeeded')
        ->and($operation->request_payload)->toBe([
            'name' => 'Provisioning Store',
            'email' => 'owner@example.test',
        ])
        ->and($ledger)->not->toContain('SecureTenantPassword123!');

    Http::assertSent(fn (Request $request) => str_ends_with($request->url(), '/administrator')
        && $request->data()['password'] === 'SecureTenantPassword123!');
});
it('runs every setup step in order without persisting the database password', function () {
    $instance = provisioningInstance();
    $tenantId = (string) Str::uuid();
    $migrationRunId = (string) Str::uuid();
    $seedRunId = (string) Str::uuid();
    $administratorRunId = (string) Str::uuid();
    $tenant = function (string $status = 'provisioning', int $version = 1) use ($instance, $tenantId): array {
        return [
            'id' => $tenantId,
            'crm_application_instance_id' => $instance->id,
            'name' => 'Provisioning Store',
            'slug' => 'provisioning-store-'.$instance->id,
            'status' => $status,
            'version' => $version,
            'schema_version' => 12,
            'data_template' => ['code' => 'grocery', 'version' => 1],
            'domain' => ['host' => 'provisioning.counterpos.pk', 'verified' => true],
            'database' => ['configured' => true],
        ];
    };

    Http::preventStrayRequests();
    Http::fake(function (Request $request) use ($tenant, $tenantId, $migrationRunId, $seedRunId, $administratorRunId) {
        $url = $request->url();
        if (str_contains($url, 'developers.hostinger.test')) {
            if ($request->method() === 'GET') {
                return Http::response(['data' => []]);
            }

            return Http::response(['message' => 'Accepted'], 201);
        }
        if (str_ends_with($url, '/health')) {
            return Http::response(['data' => ['status' => 'ok']]);
        }
        if ($request->method() === 'POST' && str_ends_with($url, '/tenants')) {
            return Http::response(['data' => $tenant()], 201);
        }
        if (str_contains($url, '/database/test')) {
            return Http::response(['data' => ['connected' => true]]);
        }
        if (str_contains($url, '/migrations') || str_contains($url, '/seed-template')) {
            return Http::response(['data' => [
                'id' => str_contains($url, 'migrations') ? $migrationRunId : $seedRunId,
                'tenant_id' => $tenantId,
                'type' => str_contains($url, 'migrations') ? 'migrate' : 'seed-template',
                'status' => 'succeeded',
            ]]);
        }
        if (str_contains($url, '/administrator')) {
            expect($request->data()['password'])->toBe('SecureTenantPassword123!');

            return Http::response(['data' => [
                'id' => $administratorRunId,
                'tenant_id' => $tenantId,
                'type' => 'configure-administrator',
                'status' => 'succeeded',
                'result' => ['admin_email' => 'owner@example.test', 'created' => true],
            ]]);
        }
        if (str_contains($url, '/by-crm-instance/')) {
            return Http::response(['data' => $tenant()]);
        }
        if (str_ends_with($url, '/status')) {
            return Http::response(['data' => $tenant('active', 2)]);
        }

        return Http::response(['data' => $tenant()]);
    });

    $run = $instance->tenantOperations()->create([
        'requested_by_id' => superAdmin()->id,
        'type' => 'provision',
        'status' => 'queued',
        'idempotency_key' => (string) Str::uuid(),
        'result' => TenantProvisioningWorkflow::initialResult(),
    ]);

    app(TenantProvisioningWorkflow::class)->run($run, null, [
        'name' => 'Provisioning Store',
        'email' => 'owner@example.test',
        'password' => 'SecureTenantPassword123!',
    ]);

    $run = $run->fresh();
    $instance = $instance->fresh();
    $ledger = json_encode($instance->tenantOperations()->get()->toArray());

    expect($run->status)->toBe('succeeded')
        ->and(collect($run->result['steps'])->pluck('status')->unique()->all())->toBe(['succeeded'])
        ->and($instance->status)->toBe('active')
        ->and($instance->counterpos_tenant_id)->toBe($tenantId)
        ->and($ledger)->not->toContain('SecureTenantPassword123!')
        ->and($ledger)->not->toContain('Cp!');

    Http::assertSent(fn (Request $request) => $request->method() === 'POST'
        && str_ends_with($request->url(), '/databases')
        && $request->data()['name'] === 'prod_cp'.$instance->id
        && $request->data()['user'] === 'prod_cp'.$instance->id);
});
