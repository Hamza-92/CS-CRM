<?php

use App\Models\Activity;
use App\Models\Product;

it('lists products for a user who may view them', function () {
    Product::factory()->count(3)->create();

    $this->actingAs(userWithRole('sales'))
        ->get('/products')
        ->assertOk();
});

it('denies the product list to a role without the permission', function () {
    $this->actingAs(userWithRole('qa'))->get('/users')->assertForbidden();
});

it('creates a product and uppercases the code', function () {
    $this->actingAs(superAdmin())
        ->post('/products', [
            'name' => 'Counter POS',
            'code' => 'cpos',
            'description' => 'Point of sale',
            'is_active' => true,
            'default_trial_days' => 14,
        ])
        ->assertRedirect();

    $product = Product::firstWhere('name', 'Counter POS');

    expect($product)->not->toBeNull()
        ->and($product->code)->toBe('CPOS');
});

it('blocks product creation for a read-only role', function () {
    $this->actingAs(userWithRole('management'))
        ->post('/products', ['name' => 'Nope', 'code' => 'NOPE'])
        ->assertForbidden();

    expect(Product::count())->toBe(0);
});

it('rejects a duplicate product code', function () {
    Product::factory()->create(['code' => 'CPOS']);

    $this->actingAs(superAdmin())
        ->post('/products', ['name' => 'Another', 'code' => 'CPOS'])
        ->assertSessionHasErrors('code');
});

it('rejects a code with invalid characters', function () {
    $this->actingAs(superAdmin())
        ->post('/products', ['name' => 'Bad', 'code' => 'has spaces!'])
        ->assertSessionHasErrors('code');
});

it('updates a product', function () {
    $product = Product::factory()->create(['name' => 'Old name']);

    $this->actingAs(superAdmin())
        ->put("/products/{$product->id}", [
            'name' => 'New name',
            'code' => $product->code,
            'is_active' => true,
        ])
        ->assertRedirect();

    expect($product->fresh()->name)->toBe('New name');
});

it('archives a product without destroying it', function () {
    $product = Product::factory()->create();

    $this->actingAs(superAdmin())
        ->delete("/products/{$product->id}")
        ->assertRedirect('/products');

    expect(Product::count())->toBe(0)
        ->and(Product::withTrashed()->count())->toBe(1);
});

it('restores an archived product', function () {
    $product = Product::factory()->create();
    $product->delete();

    $this->actingAs(superAdmin())
        ->patch("/products/{$product->id}/restore")
        ->assertRedirect();

    expect(Product::count())->toBe(1);
});

it('writes an audit trail across the product lifecycle', function () {
    $admin = superAdmin();

    $this->actingAs($admin)->post('/products', [
        'name' => 'Counter POS',
        'code' => 'CPOS',
        'is_active' => true,
    ]);

    $product = Product::firstWhere('code', 'CPOS');

    $this->actingAs($admin)->put("/products/{$product->id}", [
        'name' => 'Counter POS Pro',
        'code' => 'CPOS',
        'is_active' => false,
    ]);

    $this->actingAs($admin)->delete("/products/{$product->id}");

    $events = Activity::where('subject_type', Product::class)
        ->where('subject_id', $product->id)
        ->orderBy('id')
        ->pluck('event')
        ->all();

    expect($events)->toBe(['product.created', 'product.updated', 'product.status_changed', 'product.archived']);

    $update = Activity::where('event', 'product.updated')->first();

    expect($update->properties['old']['name'])->toBe('Counter POS')
        ->and($update->properties['new']['name'])->toBe('Counter POS Pro')
        ->and($update->user_id)->toBe($admin->id);
});

it('filters products by search term', function () {
    Product::factory()->create(['name' => 'Counter POS', 'code' => 'CPOS']);
    Product::factory()->create(['name' => 'Warehouse', 'code' => 'WHS']);

    $this->actingAs(superAdmin())
        ->get('/products?search=Counter')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('products.data', 1));
});

it('ignores an unknown sort column', function () {
    Product::factory()->count(2)->create();

    $this->actingAs(superAdmin())
        ->get('/products?sort=password&direction=asc')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('filters.sort', 'name'));
});
