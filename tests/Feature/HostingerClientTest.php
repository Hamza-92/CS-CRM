<?php

use App\Services\Hostinger\HostingerApiException;
use App\Services\Hostinger\HostingerClient;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.hostinger.base_url' => 'https://developers.hostinger.test',
        'services.hostinger.token' => 'hostinger-test-token',
        'services.hostinger.account_username' => null,
        'services.hostinger.hosting_order_id' => null,
        'services.hostinger.database_host' => null,
        'services.hostinger.database_port' => 3306,
        'services.hostinger.connect_timeout' => 2,
        'services.hostinger.timeout' => 5,
    ]);
});

it('authenticates and lists Hostinger websites with filters', function () {
    Http::preventStrayRequests();
    Http::fake(function (Request $request) {
        expect($request->method())->toBe('GET')
            ->and($request->url())->toContain('/api/hosting/v1/websites?')
            ->and($request->url())->toContain('page=2')
            ->and($request->url())->toContain('per_page=50')
            ->and($request->url())->toContain('domain=shop.example.com')
            ->and($request->header('Authorization')[0])->toBe('Bearer hostinger-test-token');

        return Http::response(['data' => [[
            'domain' => 'shop.example.com',
            'username' => 'u123456789',
            'order_id' => 123,
            'is_enabled' => true,
        ]]]);
    });

    $response = app(HostingerClient::class)->websites(2, 50, ['domain' => 'shop.example.com']);

    expect($response['data'][0]['username'])->toBe('u123456789');
});

it('sends database credentials only in the Hostinger request body', function () {
    Http::preventStrayRequests();
    Http::fake(function (Request $request) {
        expect($request->method())->toBe('POST')
            ->and($request->url())->toBe('https://developers.hostinger.test/api/hosting/v1/accounts/u123456789/databases')
            ->and($request->data())->toBe([
                'name' => 'customer_store',
                'user' => 'customer_store',
                'password' => 'temporary-secret',
                'website_domain' => 'shop.example.com',
            ]);

        return Http::response(['message' => 'Request accepted.'], 201);
    });

    $response = app(HostingerClient::class)->createDatabase(
        'u123456789',
        'customer_store',
        'customer_store',
        'temporary-secret',
        'shop.example.com',
    );

    expect($response)->toBe(['message' => 'Request accepted.']);
});

it('maps Hostinger errors without exposing arbitrary response fields', function () {
    Http::preventStrayRequests();
    Http::fake([
        '*' => Http::response([
            'message' => 'The API token is invalid.',
            'correlation_id' => 'hostinger-request-123',
            'debug' => 'must stay hidden',
        ], 401),
    ]);

    try {
        app(HostingerClient::class)->websites();
        $this->fail('Expected HostingerApiException.');
    } catch (HostingerApiException $exception) {
        expect($exception->getMessage())->toBe('The API token is invalid.')
            ->and($exception->status)->toBe(401)
            ->and($exception->correlationId)->toBe('hostinger-request-123')
            ->and($exception->getMessage())->not->toContain('hidden');
    }
});

it('reports a read-only Hostinger connection summary', function () {
    Http::preventStrayRequests();
    Http::fake([
        'https://developers.hostinger.test/api/hosting/v1/websites*' => Http::response(['data' => [
            ['domain' => 'one.example.com', 'username' => 'u123'],
            ['domain' => 'two.example.com', 'username' => 'u123'],
        ]]),
    ]);

    $this->artisan('hostinger:check')
        ->expectsOutput('Hostinger connection succeeded.')
        ->expectsOutput('Accessible websites: 2')
        ->expectsOutput('Hosting accounts: 1')
        ->assertSuccessful();
});
