<?php

namespace App\Services;

use App\Models\ApplicationInstance;
use App\Models\TenantOperation;
use App\Models\User;
use App\Services\CounterPos\CounterPosTenantService;
use App\Services\Hostinger\HostingerClient;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

final class TenantProvisioningWorkflow
{
    public const STEPS = [
        'preflight' => 'Preflight checks',
        'create_website' => 'Create Hostinger subdomain',
        'create_database' => 'Create database and user',
        'allow_database_access' => 'Allow CounterPOS database access',
        'register_tenant' => 'Register CounterPOS tenant',
        'configure_domain' => 'Configure tenant domain',
        'configure_database' => 'Send database credentials',
        'test_connection' => 'Test database connection',
        'migrate' => 'Run tenant migrations',
        'seed_template' => 'Install starter data',
        'configure_administrator' => 'Configure tenant administrator',
        'activate' => 'Activate tenant',
    ];

    public function __construct(
        private readonly HostingerClient $hostinger,
        private readonly CounterPosTenantService $counterPos,
    ) {}

    public static function initialResult(): array
    {
        return [
            'steps' => collect(self::STEPS)->map(fn (string $label, string $key) => [
                'key' => $key,
                'label' => $label,
                'status' => 'waiting',
                'message' => null,
                'started_at' => null,
                'finished_at' => null,
            ])->values()->all(),
            'context' => [],
        ];
    }

    /** @param array{name: string, email: string, password: string}|null $administrator */
    public function run(TenantOperation $run, ?string $fromStep = null, ?array $administrator = null): void
    {
        $run->load('applicationInstance.customer');
        $instance = $run->applicationInstance;
        if (! $instance) {
            throw new RuntimeException('The application instance no longer exists.');
        }

        $lock = Cache::lock('tenant-provisioning:'.$instance->id, 900);
        if (! $lock->get()) {
            return;
        }

        try {
            $this->execute($run, $instance, $fromStep, $administrator);
        } finally {
            $lock->release();
        }
    }

    /** @param array{name: string, email: string, password: string}|null $administrator */
    private function execute(TenantOperation $run, ApplicationInstance $instance, ?string $fromStep, ?array $administrator): void
    {
        $result = $run->result ?: self::initialResult();
        $existingSteps = collect($result['steps'] ?? [])->keyBy('key');
        $steps = collect(self::initialResult()['steps'])->map(function (array $step) use ($existingSteps): array {
            return [...$step, ...($existingSteps->get($step['key']) ?? []), 'label' => $step['label']];
        })->values()->all();
        $startIndex = $fromStep ? array_search($fromStep, array_keys(self::STEPS), true) : 0;
        if ($startIndex === false) {
            throw new RuntimeException('Unknown provisioning step.');
        }

        foreach ($steps as $index => &$step) {
            if ($index >= $startIndex && ($fromStep !== null || $step['status'] !== 'succeeded')) {
                $step = [...$step, 'status' => 'waiting', 'message' => null, 'started_at' => null, 'finished_at' => null];
            }
        }
        unset($step);

        $run->update([
            'status' => 'running',
            'error_code' => null,
            'error_message' => null,
            'started_at' => $run->started_at ?: now(),
            'finished_at' => null,
            'result' => ['steps' => $steps, 'context' => $result['context'] ?? []],
        ]);

        foreach (array_keys(self::STEPS) as $index => $key) {
            if ($index < $startIndex || ($steps[$index]['status'] ?? null) === 'succeeded') {
                continue;
            }

            $this->updateStep($run, $index, 'running', null, true);

            try {
                $message = $this->performStep($key, $instance->fresh(), $run, $administrator);
                $this->updateStep($run, $index, 'succeeded', $message);
            } catch (Throwable $exception) {
                $this->updateStep($run, $index, 'failed', $exception->getMessage());
                $run->update([
                    'status' => 'failed',
                    'error_code' => Str::snake(class_basename($exception)),
                    'error_message' => $exception->getMessage(),
                    'finished_at' => now(),
                ]);
                report($exception);

                return;
            }
        }

        $instance->forceFill(['status' => 'active', 'last_checked_at' => now()])->save();
        $run->update(['status' => 'succeeded', 'finished_at' => now()]);
    }

    /** @param array{name: string, email: string, password: string}|null $administrator */
    private function performStep(string $step, ApplicationInstance $instance, TenantOperation $run, ?array $administrator): string
    {
        $domain = $this->domain($instance);
        $account = (string) config('services.hostinger.account_username');
        $parentDomain = strtolower((string) config('services.hostinger.parent_domain'));
        $subdomainDirectory = trim((string) config('services.hostinger.subdomain_directory'), '/');
        $databaseHost = (string) config('services.hostinger.database_host');
        $databaseRemoteIp = (string) config('services.hostinger.database_remote_ip');
        $shortName = 'cp'.$instance->id;
        $databaseName = $this->fullDatabaseName($account, $shortName);
        $databaseUser = $this->fullDatabaseName($account, $shortName);

        return match ($step) {
            'preflight' => $this->preflight($instance, $domain, $account, $parentDomain, $subdomainDirectory, $databaseHost, $databaseRemoteIp),
            'create_website' => $this->ensureSubdomain($account, $parentDomain, $domain, $subdomainDirectory),
            'create_database' => $this->ensureDatabase($account, $shortName, $domain),
            'allow_database_access' => $this->ensureRemoteDatabaseAccess($account, $databaseName, $domain, $databaseRemoteIp),
            'register_tenant' => $this->registerTenant($instance),
            'configure_domain' => $this->configureDomain($instance, $domain),
            'configure_database' => $this->configureDatabase($instance, $databaseHost, $databaseName, $databaseUser),
            'test_connection' => $this->testConnection($instance),
            'migrate' => $this->migrate($instance),
            'seed_template' => $this->seedTemplate($instance),
            'configure_administrator' => $this->configureAdministrator($instance, $administrator),
            'activate' => $this->activate($instance),
            default => throw new RuntimeException('Unsupported provisioning step.'),
        };
    }

    private function preflight(ApplicationInstance $instance, string $domain, string $account, string $parentDomain, string $subdomainDirectory, string $databaseHost, string $databaseRemoteIp): string
    {
        if ($domain === '' || $account === '' || $parentDomain === '' || $subdomainDirectory === '' || $databaseHost === '') {
            throw new RuntimeException('Domain or Hostinger account configuration is incomplete.');
        }
        if (filter_var($databaseRemoteIp, FILTER_VALIDATE_IP) === false) {
            throw new RuntimeException('Configure the specific CounterPOS server IP for Hostinger database access.');
        }
        if (blank($instance->provisioning_template_code)) {
            throw new RuntimeException('Select a starter-data template before setup.');
        }

        $this->hostinger->websites(1, 1, ['domain' => $domain]);
        $this->counterPos->health();

        return 'Hostinger and CounterPOS connections are ready.';
    }

    private function ensureSubdomain(string $account, string $parentDomain, string $domain, string $directory): string
    {
        $suffix = '.'.$parentDomain;
        if (! str_ends_with($domain, $suffix)) {
            throw new RuntimeException("Tenant domain must be a subdomain of {$parentDomain}.");
        }
        $subdomain = substr($domain, 0, -strlen($suffix));
        if ($subdomain === '' || str_contains($subdomain, '.')) {
            throw new RuntimeException('Tenant domain must contain one subdomain label.');
        }

        $response = $this->hostinger->subdomains($account, $parentDomain);
        $subdomains = $response['data'] ?? $response;
        $existing = collect(is_array($subdomains) ? $subdomains : [])->first(
            fn (array $item) => strtolower((string) ($item['domain'] ?? '')) === $domain
        );
        if ($existing) {
            $root = str_replace('\\', '/', (string) ($existing['root_directory'] ?? $existing['rootDirectory'] ?? ''));
            if (! str_ends_with($root, '/domains/'.$parentDomain.'/public_html/'.$directory)) {
                throw new RuntimeException('The Hostinger subdomain exists but points to a different directory.');
            }

            return 'Hostinger subdomain already points to the CounterPOS public directory.';
        }

        $websites = $this->hostinger->websites(1, 25, ['domain' => $domain]);
        if (collect($websites['data'] ?? [])->contains(fn (array $website) => strtolower((string) ($website['domain'] ?? '')) === $domain)) {
            throw new RuntimeException('The tenant domain exists as a standalone Hostinger website. Remove it before creating the shared-code subdomain.');
        }

        $this->hostinger->createSubdomain($account, $parentDomain, $subdomain, $directory);

        return 'Hostinger subdomain points to the CounterPOS public directory.';
    }

    private function ensureDatabase(string $account, string $shortName, string $domain): string
    {
        $fullName = $this->fullDatabaseName($account, $shortName);
        $databases = $this->hostinger->databases($account, 1, 25, ['search' => $shortName]);
        if (collect($databases['data'] ?? [])->contains(fn (array $database) => (string) ($database['name'] ?? '') === $fullName)) {
            return 'Database already exists; reused safely.';
        }

        $this->hostinger->createDatabase($account, $shortName, $shortName, $this->databasePassword((int) str_replace('cp', '', $shortName)), $domain);

        return 'Database and database user created.';
    }

    private function ensureRemoteDatabaseAccess(string $account, string $databaseName, string $domain, string $ip): string
    {
        $response = $this->hostinger->remoteDatabaseConnections($account, $domain);
        $connections = $response['data'] ?? $response;
        $exists = collect(is_array($connections) ? $connections : [])->contains(function (array $connection) use ($databaseName, $ip): bool {
            $connectionDatabase = (string) ($connection['database_name'] ?? $connection['databaseName'] ?? '');

            return $connectionDatabase === $databaseName && (string) ($connection['ip'] ?? '') === $ip;
        });
        if ($exists) {
            return 'CounterPOS database access already allowed.';
        }

        $this->hostinger->createRemoteDatabaseConnection($account, $databaseName, $ip);

        return 'CounterPOS server IP allowed for this database.';
    }

    private function registerTenant(ApplicationInstance $instance): string
    {
        if ($instance->counterpos_tenant_id) {
            $this->counterPos->refresh($instance);

            return 'CounterPOS tenant already linked.';
        }

        $customer = $instance->customer;
        $this->counterPos->register($instance, [
            'name' => $customer->business ?: $customer->name,
            'slug' => Str::slug(($customer->business ?: $customer->name).'-'.$instance->id),
            'contact_name' => $customer->name,
            'contact_email' => $customer->email,
            'contact_phone' => $customer->phone,
            'data_template_code' => $instance->provisioning_template_code,
            'data_template_version' => $instance->provisioning_template_version ?: 1,
        ], $this->requestedBy($instance));

        return 'CounterPOS tenant registered.';
    }

    private function configureDomain(ApplicationInstance $instance, string $domain): string
    {
        $this->counterPos->configureDomain($instance, $domain, true, $this->requestedBy($instance));

        return 'Primary tenant domain configured.';
    }

    private function configureDatabase(ApplicationInstance $instance, string $host, string $name, string $user): string
    {
        $this->counterPos->configureDatabase($instance, [
            'host' => $host,
            'port' => (int) config('services.hostinger.database_port', 3306),
            'database_name' => $name,
            'username' => $user,
            'password' => $this->databasePassword($instance->id),
        ], $this->requestedBy($instance));

        return 'Database credentials delivered securely.';
    }

    private function testConnection(ApplicationInstance $instance): string
    {
        $this->counterPos->testDatabase($instance, $this->requestedBy($instance));

        return 'Database connection verified.';
    }

    private function migrate(ApplicationInstance $instance): string
    {
        $this->counterPos->migrate($instance, $this->requestedBy($instance));

        return 'Tenant migrations completed.';
    }

    private function seedTemplate(ApplicationInstance $instance): string
    {
        $this->counterPos->seedTemplate($instance, $this->requestedBy($instance));

        return 'Starter data installed.';
    }

    /** @param array{name: string, email: string, password: string}|null $administrator */
    private function configureAdministrator(ApplicationInstance $instance, ?array $administrator): string
    {
        if ($administrator === null) {
            throw new RuntimeException('Enter the tenant administrator details to continue setup.');
        }

        $this->counterPos->configureAdministrator($instance, $administrator, $this->requestedBy($instance));

        return 'Tenant administrator configured.';
    }

    private function activate(ApplicationInstance $instance): string
    {
        $response = $this->counterPos->refresh($instance);
        $tenant = $response['data'] ?? [];
        if (($tenant['status'] ?? null) === 'active') {
            return 'Tenant is already active.';
        }

        $this->counterPos->changeStatus($instance, 'active', (int) ($tenant['version'] ?? 1), null, $this->requestedBy($instance));

        return 'Tenant activated.';
    }

    private function updateStep(TenantOperation $run, int $index, string $status, ?string $message, bool $starting = false): void
    {
        $result = $run->fresh()->result ?: self::initialResult();
        $steps = $result['steps'];
        $steps[$index]['status'] = $status;
        $steps[$index]['message'] = $message;
        if ($starting) {
            $steps[$index]['started_at'] = now()->toISOString();
        }
        if (in_array($status, ['succeeded', 'failed'], true)) {
            $steps[$index]['finished_at'] = now()->toISOString();
        }
        $run->update(['result' => ['steps' => $steps, 'context' => $result['context'] ?? []]]);
    }

    private function domain(ApplicationInstance $instance): string
    {
        return strtolower((string) parse_url((string) $instance->deployment_url, PHP_URL_HOST));
    }

    private function fullDatabaseName(string $account, string $shortName): string
    {
        return Str::startsWith($shortName, $account.'_') ? $shortName : $account.'_'.$shortName;
    }

    private function databasePassword(int $instanceId): string
    {
        $secret = (string) config('app.key');
        if ($secret === '') {
            throw new RuntimeException('Application encryption key is not configured.');
        }

        return 'Cp!'.substr(strtr(base64_encode(hash_hmac('sha256', 'tenant-db:'.$instanceId, $secret, true)), '+/', 'Az'), 0, 28).'9a';
    }

    private function requestedBy(ApplicationInstance $instance): ?User
    {
        $run = $instance->tenantOperations()->where('type', 'provision')->latest()->first();

        return $run?->requestedBy;
    }
}
