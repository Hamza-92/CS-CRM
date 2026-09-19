<?php

namespace App\Console\Commands;

use App\Services\CounterPos\CounterPosClient;
use Illuminate\Console\Command;
use Throwable;

final class CheckCounterPosConnection extends Command
{
    protected $signature = 'counterpos:check {--instance= : CRM application instance ID to look up}';

    protected $description = 'Verify the signed server-to-server connection to CounterPOS.';

    public function handle(CounterPosClient $client): int
    {
        try {
            $health = $client->health()['data'] ?? [];
            $this->info('CounterPOS connection succeeded.');
            $this->line('Service: '.($health['service'] ?? 'unknown'));
            $this->line('API version: '.($health['api_version'] ?? 'unknown'));

            $instanceId = $this->option('instance');
            if ($instanceId !== null && $instanceId !== '') {
                if (! ctype_digit((string) $instanceId) || (int) $instanceId < 1) {
                    $this->error('The --instance option must be a positive integer.');

                    return self::INVALID;
                }

                $tenant = $client->tenantForCrmInstance((int) $instanceId)['data'] ?? [];
                $this->newLine();
                $this->line('Tenant: '.($tenant['name'] ?? 'unknown'));
                $this->line('Tenant ID: '.($tenant['id'] ?? 'unknown'));
                $this->line('Status: '.($tenant['status'] ?? 'unknown'));
            }

            return self::SUCCESS;
        } catch (Throwable $exception) {
            $this->error('CounterPOS connection failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
