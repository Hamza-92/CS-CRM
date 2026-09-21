<?php

namespace App\Services\CounterPos;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use LogicException;

final class CounterPosClient
{
    /** @return array<string, mixed> */
    public function health(): array
    {
        return $this->request('GET', '/health');
    }

    /** @return array<string, mixed> */
    public function tenantForCrmInstance(int $applicationInstanceId): array
    {
        if ($applicationInstanceId < 1) {
            throw new LogicException('The CRM application instance ID must be positive.');
        }

        return $this->request('GET', '/tenants/by-crm-instance/'.$applicationInstanceId);
    }

    /** @return array<string, mixed> */
    public function registerTenant(array $payload, string $idempotencyKey): array
    {
        return $this->request('POST', '/tenants', $payload, $idempotencyKey);
    }

    /** @return array<string, mixed> */
    public function saveDomain(string $tenantId, array $payload, string $idempotencyKey): array
    {
        return $this->request('PUT', '/tenants/'.$tenantId.'/domain', $payload, $idempotencyKey);
    }

    /** @return array<string, mixed> */
    public function saveDatabase(string $tenantId, array $payload, string $idempotencyKey): array
    {
        return $this->request('PUT', '/tenants/'.$tenantId.'/database', $payload, $idempotencyKey);
    }

    /** @return array<string, mixed> */
    public function testDatabase(string $tenantId, string $idempotencyKey): array
    {
        return $this->request('POST', '/tenants/'.$tenantId.'/database/test', [], $idempotencyKey);
    }

    /** @return array<string, mixed> */
    public function migrate(string $tenantId, string $idempotencyKey): array
    {
        return $this->request('POST', '/tenants/'.$tenantId.'/migrations', [], $idempotencyKey, (int) config('services.counterpos.long_timeout', 900));
    }

    /** @return array<string, mixed> */
    public function seedTemplate(string $tenantId, array $payload, string $idempotencyKey): array
    {
        return $this->request('POST', '/tenants/'.$tenantId.'/seed-template', $payload, $idempotencyKey, (int) config('services.counterpos.long_timeout', 900));
    }

    /** @return array<string, mixed> */
    public function configureAdministrator(string $tenantId, array $payload, string $idempotencyKey): array
    {
        return $this->request('PUT', '/tenants/'.$tenantId.'/administrator', $payload, $idempotencyKey);
    }

    /** @return array<string, mixed> */
    public function changeStatus(string $tenantId, array $payload, string $idempotencyKey): array
    {
        return $this->request('PUT', '/tenants/'.$tenantId.'/status', $payload, $idempotencyKey);
    }

    /** @return array<string, mixed> */
    public function operation(string $operationId): array
    {
        return $this->request('GET', '/operations/'.$operationId);
    }

    /** @return array<string, mixed> */
    private function request(string $method, string $path, array $payload = [], ?string $idempotencyKey = null, ?int $timeout = null): array
    {
        $baseUrl = rtrim((string) config('services.counterpos.base_url'), '/');
        $key = (string) config('services.counterpos.key');
        $secret = (string) config('services.counterpos.secret');

        if ($baseUrl === '' || $key === '' || $secret === '') {
            throw new LogicException('CounterPOS API connection is not configured.');
        }
        if ($idempotencyKey !== null && ! Str::isUuid($idempotencyKey)) {
            throw new LogicException('CounterPOS mutation idempotency key must be a UUID.');
        }

        $url = $baseUrl.'/'.ltrim($path, '/');
        $requestTarget = (string) parse_url($url, PHP_URL_PATH);
        $query = parse_url($url, PHP_URL_QUERY);
        if (is_string($query) && $query !== '') {
            $requestTarget .= '?'.$query;
        }

        $method = strtoupper($method);
        $timestamp = (string) time();
        $nonce = (string) Str::uuid();
        $body = $payload === [] ? '' : json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $canonical = implode("\n", [$timestamp, $nonce, $method, $requestTarget, hash('sha256', $body)]);
        $headers = [
            'X-CRM-Key' => $key,
            'X-CRM-Timestamp' => $timestamp,
            'X-CRM-Nonce' => $nonce,
            'X-CRM-Signature' => hash_hmac('sha256', $canonical, $secret),
        ];
        if ($idempotencyKey !== null) {
            $headers['Idempotency-Key'] = $idempotencyKey;
        }
        $hostHeader = trim((string) config('services.counterpos.host_header', ''));
        if ($hostHeader !== '') {
            $headers['Host'] = $hostHeader;
        }

        $request = $this->http($timeout)->withHeaders($headers);
        $response = $body === ''
            ? $request->send($method, $url)
            : $request->withBody($body, 'application/json')->send($method, $url);

        if (! $response->successful()) {
            $message = (string) ($response->json('message') ?: 'CounterPOS API request failed.');
            $code = $response->json('code');

            throw new CounterPosApiException($message, $response->status(), is_string($code) ? $code : null);
        }

        $data = $response->json();
        if (! is_array($data)) {
            throw new CounterPosApiException('CounterPOS API returned an invalid response.', $response->status());
        }

        return $data;
    }

    private function http(?int $timeout = null): PendingRequest
    {
        return Http::acceptJson()
            ->connectTimeout((int) config('services.counterpos.connect_timeout', 5))
            ->timeout($timeout ?? (int) config('services.counterpos.timeout', 15));
    }
}
