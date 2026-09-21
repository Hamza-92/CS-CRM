<?php

namespace App\Services\Hostinger;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use LogicException;

final class HostingerClient
{
    /** @return array<string, mixed> */
    public function websites(int $page = 1, int $perPage = 25, array $filters = []): array
    {
        return $this->request('GET', '/api/hosting/v1/websites', array_filter([
            'page' => $page,
            'per_page' => $perPage,
            'username' => $filters['username'] ?? null,
            'order_id' => $filters['order_id'] ?? null,
            'is_enabled' => $filters['is_enabled'] ?? null,
            'domain' => $filters['domain'] ?? null,
        ], static fn (mixed $value): bool => $value !== null && $value !== ''));
    }

    /** @return array<string, mixed> */
    public function createWebsite(string $domain, int $orderId, ?string $datacenterCode = null): array
    {
        $payload = ['domain' => $domain, 'order_id' => $orderId];
        if ($datacenterCode !== null && $datacenterCode !== '') {
            $payload['datacenter_code'] = $datacenterCode;
        }

        return $this->request('POST', '/api/hosting/v1/websites', $payload);
    }

    /** @return array<string, mixed> */
    public function deleteWebsite(string $domain): array
    {
        return $this->request('DELETE', '/api/hosting/v1/websites/'.rawurlencode($domain));
    }

    /** @return array<string, mixed> */
    public function subdomains(string $accountUsername, string $parentDomain): array
    {
        return $this->request('GET', '/api/hosting/v1/accounts/'.rawurlencode($accountUsername).'/websites/'.rawurlencode($parentDomain).'/subdomains');
    }

    /** @return array<string, mixed> */
    public function createSubdomain(string $accountUsername, string $parentDomain, string $subdomain, string $directory): array
    {
        return $this->request('POST', '/api/hosting/v1/accounts/'.rawurlencode($accountUsername).'/websites/'.rawurlencode($parentDomain).'/subdomains', [
            'subdomain' => $subdomain,
            'directory' => $directory,
            'is_using_public_directory' => false,
        ]);
    }

    /** @return array<string, mixed> */
    public function databases(string $accountUsername, int $page = 1, int $perPage = 25, array $filters = []): array
    {
        return $this->request('GET', '/api/hosting/v1/accounts/'.rawurlencode($accountUsername).'/databases', array_filter([
            'page' => $page,
            'per_page' => $perPage,
            'domain' => $filters['domain'] ?? null,
            'is_assigned' => $filters['is_assigned'] ?? null,
            'search' => $filters['search'] ?? null,
        ], static fn (mixed $value): bool => $value !== null && $value !== ''));
    }

    /** @return array<string, mixed> */
    public function createDatabase(string $accountUsername, string $name, string $user, string $password, string $websiteDomain): array
    {
        return $this->request('POST', '/api/hosting/v1/accounts/'.rawurlencode($accountUsername).'/databases', [
            'name' => $name,
            'user' => $user,
            'password' => $password,
            'website_domain' => $websiteDomain,
        ]);
    }

    /** @return array<string, mixed> */
    public function remoteDatabaseConnections(string $accountUsername, ?string $domain = null): array
    {
        return $this->request('GET', '/api/hosting/v1/accounts/'.rawurlencode($accountUsername).'/databases/remote-connections', array_filter([
            'domain' => $domain,
        ], static fn (mixed $value): bool => $value !== null && $value !== ''));
    }

    /** @return array<string, mixed> */
    public function createRemoteDatabaseConnection(string $accountUsername, string $databaseName, string $ip): array
    {
        return $this->request('POST', '/api/hosting/v1/accounts/'.rawurlencode($accountUsername).'/databases/'.rawurlencode($databaseName).'/remote-connections', [
            'ip' => $ip,
        ]);
    }

    /** @return array<string, mixed> */
    public function dnsRecords(string $domain): array
    {
        return $this->request('GET', '/api/dns/v1/zones/'.rawurlencode($domain));
    }

    /** @param array<int, array<string, mixed>> $zone
     * @return array<string, mixed>
     */
    public function updateDnsRecords(string $domain, array $zone, bool $overwrite = false): array
    {
        return $this->request('PUT', '/api/dns/v1/zones/'.rawurlencode($domain), [
            'overwrite' => $overwrite,
            'zone' => $zone,
        ]);
    }

    /** @return array<string, mixed> */
    private function request(string $method, string $path, array $payload = []): array
    {
        $baseUrl = rtrim((string) config('services.hostinger.base_url'), '/');
        $token = trim((string) config('services.hostinger.token'));

        if ($baseUrl === '' || $token === '') {
            throw new LogicException('Hostinger API connection is not configured.');
        }

        $method = strtoupper($method);
        $request = $this->http($token);
        $response = $method === 'GET'
            ? $request->get($baseUrl.$path, $payload)
            : $request->send($method, $baseUrl.$path, ['json' => $payload]);

        if (! $response->successful()) {
            throw $this->exception($response);
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new HostingerApiException('Hostinger API returned an invalid response.', $response->status());
        }

        return $data;
    }

    private function http(string $token): PendingRequest
    {
        return Http::acceptJson()
            ->asJson()
            ->withToken($token)
            ->connectTimeout((int) config('services.hostinger.connect_timeout', 5))
            ->timeout((int) config('services.hostinger.timeout', 20));
    }

    private function exception(Response $response): HostingerApiException
    {
        $message = $response->json('message');
        $correlationId = $response->json('correlation_id') ?? $response->header('X-Correlation-ID');

        return new HostingerApiException(
            is_string($message) && $message !== '' ? $message : 'Hostinger API request failed.',
            $response->status(),
            is_string($correlationId) && $correlationId !== '' ? $correlationId : null,
        );
    }
}
