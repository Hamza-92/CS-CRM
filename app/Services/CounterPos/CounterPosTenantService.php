<?php

namespace App\Services\CounterPos;

use App\Models\ApplicationInstance;
use App\Models\TenantOperation;
use App\Models\User;
use Illuminate\Support\Str;
use Throwable;

final class CounterPosTenantService
{
    public function __construct(private readonly CounterPosClient $client) {}

    /** @return array<string, mixed> */
    public function health(): array
    {
        return $this->client->health();
    }

    public function register(ApplicationInstance $instance, array $tenant, ?User $requestedBy = null): TenantOperation
    {
        $payload = $tenant + ['crm_application_instance_id' => $instance->id];

        return $this->perform($instance, 'register', $payload, $requestedBy,
            fn (string $key) => $this->client->registerTenant($payload, $key));
    }

    public function configureDomain(ApplicationInstance $instance, string $host, bool $verified, ?User $requestedBy = null): TenantOperation
    {
        $payload = ['host' => $host, 'verified' => $verified];

        return $this->perform($instance, 'configure_domain', $payload, $requestedBy,
            fn (string $key) => $this->client->saveDomain($this->tenantId($instance), $payload, $key));
    }

    public function configureDatabase(ApplicationInstance $instance, array $credentials, ?User $requestedBy = null): TenantOperation
    {
        return $this->perform($instance, 'configure_database', ['credentials_provided' => true], $requestedBy,
            fn (string $key) => $this->client->saveDatabase($this->tenantId($instance), $credentials, $key));
    }

    public function testDatabase(ApplicationInstance $instance, ?User $requestedBy = null): TenantOperation
    {
        return $this->perform($instance, 'test_connection', [], $requestedBy,
            fn (string $key) => $this->client->testDatabase($this->tenantId($instance), $key));
    }

    public function migrate(ApplicationInstance $instance, ?User $requestedBy = null): TenantOperation
    {
        $operation = $this->perform($instance, 'migrate', [], $requestedBy,
            fn (string $key) => $this->client->migrate($this->tenantId($instance), $key));
        $this->refresh($instance);

        return $operation;
    }

    public function seedTemplate(ApplicationInstance $instance, ?User $requestedBy = null): TenantOperation
    {
        $payload = [
            'template_code' => $instance->provisioning_template_code,
            'template_version' => $instance->provisioning_template_version ?: 1,
        ];
        $operation = $this->perform($instance, 'seed_template', $payload, $requestedBy,
            fn (string $key) => $this->client->seedTemplate($this->tenantId($instance), $payload, $key));
        $this->refresh($instance);

        return $operation;
    }

    /** @param array{name: string, email: string, password: string} $administrator */
    public function configureAdministrator(ApplicationInstance $instance, array $administrator, ?User $requestedBy = null): TenantOperation
    {
        $safePayload = [
            'name' => $administrator['name'],
            'email' => strtolower($administrator['email']),
        ];

        return $this->perform($instance, 'configure_administrator', $safePayload, $requestedBy,
            fn (string $key) => $this->client->configureAdministrator($this->tenantId($instance), $administrator, $key));
    }

    public function changeStatus(ApplicationInstance $instance, string $status, int $version, ?string $reason = null, ?User $requestedBy = null): TenantOperation
    {
        $payload = ['status' => $status, 'version' => $version, 'reason' => $reason];

        return $this->perform($instance, $status === 'active' ? 'activate' : ($status === 'suspended' ? 'pause' : 'retire'), $payload, $requestedBy,
            fn (string $key) => $this->client->changeStatus($this->tenantId($instance), $payload, $key));
    }

    /** @return array<string, mixed> */
    public function refresh(ApplicationInstance $instance): array
    {
        $response = $this->client->tenantForCrmInstance($instance->id);
        $this->syncInstance($instance, $response['data'] ?? []);

        return $response;
    }

    private function perform(ApplicationInstance $instance, string $type, array $safePayload, ?User $requestedBy, callable $request): TenantOperation
    {
        $operation = $instance->tenantOperations()->create([
            'requested_by_id' => $requestedBy?->id,
            'type' => $type,
            'status' => 'running',
            'idempotency_key' => (string) Str::uuid(),
            'request_payload' => $safePayload === [] ? null : $safePayload,
            'started_at' => now(),
        ]);

        try {
            $response = $request($operation->idempotency_key);
            $data = is_array($response['data'] ?? null) ? $response['data'] : [];
            $isRemoteOperation = isset($data['tenant_id'], $data['type']);
            $operation->update([
                'status' => 'succeeded',
                'counterpos_operation_id' => $isRemoteOperation ? ($data['id'] ?? null) : null,
                'result' => $data,
                'finished_at' => now(),
            ]);
            if (isset($data['crm_application_instance_id'])) {
                $this->syncInstance($instance, $data);
            }
        } catch (CounterPosApiException $exception) {
            $operation->update([
                'status' => 'failed',
                'error_code' => $exception->apiCode,
                'error_message' => $exception->getMessage(),
                'finished_at' => now(),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $operation->update([
                'status' => 'failed',
                'error_code' => 'counterpos_unavailable',
                'error_message' => 'CounterPOS could not be reached.',
                'finished_at' => now(),
            ]);
            throw $exception;
        }

        return $operation->fresh();
    }

    private function tenantId(ApplicationInstance $instance): string
    {
        $tenantId = (string) $instance->counterpos_tenant_id;
        if (! Str::isUuid($tenantId)) {
            throw new \LogicException('The CRM application instance is not linked to a CounterPOS tenant.');
        }

        return $tenantId;
    }

    /** @param array<string, mixed> $tenant */
    private function syncInstance(ApplicationInstance $instance, array $tenant): void
    {
        $template = is_array($tenant['data_template'] ?? null) ? $tenant['data_template'] : [];
        $domain = is_array($tenant['domain'] ?? null) ? $tenant['domain'] : [];
        $instance->forceFill([
            'counterpos_tenant_id' => $tenant['id'] ?? $instance->counterpos_tenant_id,
            'counterpos_status' => $tenant['status'] ?? $instance->counterpos_status,
            'counterpos_schema_version' => $tenant['schema_version'] ?? $instance->counterpos_schema_version,
            'provisioning_template_code' => $template['code'] ?? $instance->provisioning_template_code,
            'provisioning_template_version' => $template['version'] ?? $instance->provisioning_template_version,
            'deployment_url' => isset($domain['host']) ? 'https://'.$domain['host'] : $instance->deployment_url,
            'last_synced_at' => now(),
        ])->save();
    }
}
