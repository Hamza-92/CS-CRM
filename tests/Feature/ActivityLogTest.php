<?php

use App\Models\Activity;
use App\Models\Product;
use App\Support\Audit\ActivityLogger;

it('shows the activity log to permitted roles only', function () {
    $this->actingAs(userWithRole('management'))->get('/activity')->assertOk();
    $this->actingAs(userWithRole('sales'))->get('/activity')->assertForbidden();
});

it('attributes an event to no user when the system acts', function () {
    Product::factory()->create();

    expect(Activity::latest('id')->first()->user_id)->toBeNull();
});

it('records a snapshot on create and a diff on update', function () {
    $product = Product::factory()->create(['name' => 'First']);

    $created = Activity::where('event', 'product.created')->first();
    expect($created->properties)->toHaveKey('new')
        ->and($created->properties['new']['name'])->toBe('First')
        ->and($created->properties)->not->toHaveKey('old');

    $product->update(['name' => 'Second']);

    $updated = Activity::where('event', 'product.updated')->first();
    expect($updated->properties['old'])->toBe(['name' => 'First'])
        ->and($updated->properties['new'])->toBe(['name' => 'Second']);
});

it('does not log an update when no audited attribute changed', function () {
    $product = Product::factory()->create();
    $before = Activity::count();

    $product->touch();

    expect(Activity::count())->toBe($before);
});

it('distinguishes archiving from force deleting', function () {
    $first = Product::factory()->create();
    $first->delete();

    expect(Activity::latest('id')->first()->event)->toBe('product.archived');

    $second = Product::factory()->create();
    $second->forceDelete();

    expect(Activity::latest('id')->first()->event)->toBe('product.deleted');
});

it('logs a restore', function () {
    $product = Product::factory()->create();
    $product->delete();
    $product->restore();

    expect(Activity::latest('id')->first()->event)->toBe('product.restored');
});

it('redacts secret-looking values', function () {
    $activity = app(ActivityLogger::class)->log(
        event: 'instance.credentials_changed',
        properties: [
            'new' => [
                'db_password' => 'hunter2',
                'api_key' => 'sk-live-123',
                'AUTH_TOKEN' => 'abc',
                'hostname' => 'vps-01',
            ],
        ],
    );

    expect($activity->properties['new']['db_password'])->toBe('[redacted]')
        ->and($activity->properties['new']['api_key'])->toBe('[redacted]')
        ->and($activity->properties['new']['AUTH_TOKEN'])->toBe('[redacted]')
        ->and($activity->properties['new']['hostname'])->toBe('vps-01');
});

it('has no updated_at column so entries cannot be silently rewritten', function () {
    $activity = app(ActivityLogger::class)->log('system.check');

    expect(Activity::UPDATED_AT)->toBeNull()
        ->and($activity->getAttributes())->not->toHaveKey('updated_at');
});

it('filters the log by event prefix', function () {
    Product::factory()->create();
    app(ActivityLogger::class)->log('system.import_completed');

    $this->actingAs(superAdmin())
        ->get('/activity?event=system')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('activities.data', 1));
});
