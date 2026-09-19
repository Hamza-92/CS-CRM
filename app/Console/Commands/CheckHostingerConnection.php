<?php

namespace App\Console\Commands;

use App\Services\Hostinger\HostingerApiException;
use App\Services\Hostinger\HostingerClient;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Throwable;

final class CheckHostingerConnection extends Command
{
    protected $signature = 'hostinger:check';

    protected $description = 'Verify the CRM server connection and configured provisioning target in Hostinger.';

    public function handle(HostingerClient $client): int
    {
        try {
            $response = $client->websites(perPage: 100);
            $websites = $response['data'] ?? $response;
            $websites = collect(is_array($websites) ? array_values(array_filter($websites, 'is_array')) : []);
            $accounts = $websites
                ->filter(fn (array $website): bool => is_string($website['username'] ?? null) && $website['username'] !== '')
                ->groupBy('username');

            $this->info('Hostinger connection succeeded.');
            $this->line('Accessible websites: '.$websites->count());
            $this->line('Hosting accounts: '.$accounts->count());

            if ($accounts->isNotEmpty()) {
                $this->newLine();
                $this->table(['Account username', 'Order IDs', 'Websites'], $accounts->map(fn ($accountWebsites, string $username): array => [
                    $username,
                    $accountWebsites->pluck('order_id')->filter()->unique()->sort()->implode(', '),
                    $accountWebsites->count(),
                ])->values()->all());
            }

            return $this->verifyProvisioningTarget($client, $websites);
        } catch (HostingerApiException $exception) {
            $suffix = $exception->correlationId ? ' Correlation ID: '.$exception->correlationId : '';
            $this->error('Hostinger connection failed: '.$exception->getMessage().$suffix);

            return self::FAILURE;
        } catch (Throwable $exception) {
            $this->error('Hostinger connection failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }

    private function verifyProvisioningTarget(HostingerClient $client, Collection $websites): int
    {
        $accountUsername = trim((string) config('services.hostinger.account_username'));
        $orderId = config('services.hostinger.hosting_order_id');
        if ($accountUsername === '' && $orderId === null) {
            $this->warn('No default Hostinger provisioning target is configured.');

            return self::SUCCESS;
        }
        if ($accountUsername === '' || ! is_int($orderId) || $orderId < 1) {
            $this->error('Both HOSTINGER_ACCOUNT_USERNAME and HOSTINGER_HOSTING_ORDER_ID must be configured.');

            return self::FAILURE;
        }

        $targetExists = $websites->contains(fn (array $website): bool => ($website['username'] ?? null) === $accountUsername
            && (int) ($website['order_id'] ?? 0) === $orderId);
        if (! $targetExists) {
            $this->error('The configured Hostinger account and order were not found in the accessible websites.');

            return self::FAILURE;
        }

        $databaseResponse = $client->databases($accountUsername, perPage: 100);
        $databases = $databaseResponse['data'] ?? $databaseResponse;
        $databases = collect(is_array($databases) ? array_values(array_filter($databases, 'is_array')) : []);
        $databaseHost = trim((string) config('services.hostinger.database_host'));
        $databasePort = (int) config('services.hostinger.database_port', 3306);

        $this->newLine();
        $this->info('Default provisioning target verified.');
        $this->line('Account username: '.$accountUsername);
        $this->line('Hosting order ID: '.$orderId);
        $this->line('Existing databases: '.$databases->count());
        if ($databaseHost !== '') {
            $this->line('Database endpoint: '.$databaseHost.':'.$databasePort);
        }

        return self::SUCCESS;
    }
}
