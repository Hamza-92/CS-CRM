<?php

use App\Services\CounterPos\CounterPosApiException;
use App\Services\CounterPos\CounterPosClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

beforeEach(function () {
    config([
        'services.counterpos.base_url' => 'https://admin.counterpos.test/api/control/v1',
        'services.counterpos.key' => 'crm-test-key',
        'services.counterpos.secret' => 'crm-test-secret',
        'services.counterpos.connect_timeout' => 2,
        'services.counterpos.timeout' => 5,
    ]);
});

it('signs CounterPOS requests using the canonical request target and body hash', function () {
    Http::preventStrayRequests();
    Http::fake(function (Request $request) {
        $timestamp = $request->header('X-CRM-Timestamp')[0];
        $nonce = $request->header('X-CRM-Nonce')[0];
        $target = (string) parse_url($request->url(), PHP_URL_PATH);
        $query = parse_url($request->url(), PHP_URL_QUERY);
        if (is_string($query) && $query !== '') {
            $target .= '?'.$query;
        }
        $canonical = implode("\n", [
            $timestamp,
            $nonce,
            $request->method(),
            $target,
            hash('sha256', $request->body()),
        ]);

        expect($request->header('X-CRM-Key')[0])->toBe('crm-test-key')
            ->and($nonce)->toMatch('/^[0-9a-f-]{36}$/')
            ->and($request->header('X-CRM-Signature')[0])->toBe(hash_hmac('sha256', $canonical, 'crm-test-secret'));

        return Http::response([
            'data' => [
                'service' => 'counterpos-control',
                'api_version' => 'v1',
                'status' => 'ok',
            ],
        ]);
    });

    $response = app(CounterPosClient::class)->health();

    expect($response['data']['status'])->toBe('ok');
});

it('looks up a CounterPOS tenant by CRM application instance ID', function () {
    Http::preventStrayRequests();
    Http::fake([
        'https://admin.counterpos.test/api/control/v1/tenants/by-crm-instance/42' => Http::response([
            'data' => ['id' => 'tenant-uuid', 'crm_application_instance_id' => 42, 'status' => 'active'],
        ]),
    ]);

    $response = app(CounterPosClient::class)->tenantForCrmInstance(42);

    expect($response['data']['id'])->toBe('tenant-uuid');
    Http::assertSent(fn (Request $request) => $request->url() === 'https://admin.counterpos.test/api/control/v1/tenants/by-crm-instance/42');
});

it('maps safe CounterPOS API errors without exposing arbitrary response content', function () {
    Http::preventStrayRequests();
    Http::fake([
        '*' => Http::response(['message' => 'No tenant is linked.', 'code' => 'tenant_not_linked', 'debug' => 'hidden'], 404),
    ]);

    try {
        app(CounterPosClient::class)->tenantForCrmInstance(42);
        $this->fail('Expected CounterPosApiException.');
    } catch (CounterPosApiException $exception) {
        expect($exception->getMessage())->toBe('No tenant is linked.')
            ->and($exception->status)->toBe(404)
            ->and($exception->apiCode)->toBe('tenant_not_linked')
            ->and($exception->getMessage())->not->toContain('hidden');
    }
});

it('sends mutation payloads with signed bodies and idempotency keys', function () {
    Http::preventStrayRequests();
    $idempotencyKey = (string) Str::uuid();
    Http::fake(function (Request $request) use ($idempotencyKey) {
        $timestamp = $request->header('X-CRM-Timestamp')[0];
        $nonce = $request->header('X-CRM-Nonce')[0];
        $target = (string) parse_url($request->url(), PHP_URL_PATH);
        $canonical = implode("\n", [$timestamp, $nonce, 'POST', $target, hash('sha256', $request->body())]);

        expect($request->header('Idempotency-Key')[0])->toBe($idempotencyKey)
            ->and($request->header('X-CRM-Signature')[0])->toBe(hash_hmac('sha256', $canonical, 'crm-test-secret'))
            ->and($request->data()['crm_application_instance_id'])->toBe(42);

        return Http::response(['data' => ['id' => '53e80519-8f24-48a5-b747-c72d3c740977', 'crm_application_instance_id' => 42]], 201);
    });

    $response = app(CounterPosClient::class)->registerTenant([
        'crm_application_instance_id' => 42,
        'name' => 'Example Tenant',
        'slug' => 'example-tenant',
    ], $idempotencyKey);

    expect($response['data']['crm_application_instance_id'])->toBe(42);
});
