<?php

use App\Enums\BillingCycle;
use App\Models\Plan;
use App\Models\Product;

it('creates a plan under a product', function () {
    $product = Product::factory()->create();

    $this->actingAs(superAdmin())
        ->post("/products/{$product->id}/plans", [
            'name' => 'Annual',
            'code' => 'ann',
            'billing_cycle' => BillingCycle::Annual->value,
            'duration_days' => 365,
            'price' => '25000',
            'currency' => 'PKR',
            'grace_days' => 7,
            'is_active' => true,
            'sort_order' => 0,
        ])
        ->assertRedirect("/products/{$product->id}");

    $plan = Plan::firstWhere('code', 'ANN');

    expect($plan)->not->toBeNull()
        ->and($plan->product_id)->toBe($product->id)
        ->and($plan->billing_cycle)->toBe(BillingCycle::Annual);
});

it('requires a duration for every cycle except lifetime', function () {
    $product = Product::factory()->create();

    $this->actingAs(superAdmin())
        ->post("/products/{$product->id}/plans", [
            'name' => 'Monthly',
            'code' => 'MON',
            'billing_cycle' => BillingCycle::Monthly->value,
            'price' => '1000',
            'currency' => 'PKR',
            'grace_days' => 0,
        ])
        ->assertSessionHasErrors('duration_days');
});

it('stores a lifetime plan with a null duration', function () {
    $product = Product::factory()->create();

    $this->actingAs(superAdmin())
        ->post("/products/{$product->id}/plans", [
            'name' => 'Lifetime',
            'code' => 'LIFE',
            'billing_cycle' => BillingCycle::Lifetime->value,
            'duration_days' => 999,
            'price' => '90000',
            'currency' => 'PKR',
            'grace_days' => 0,
        ])
        ->assertRedirect();

    expect(Plan::firstWhere('code', 'LIFE')->duration_days)->toBeNull();
});

it('allows the same plan code under different products', function () {
    $first = Product::factory()->create();
    $second = Product::factory()->create();

    Plan::factory()->for($first)->create(['code' => 'ANN']);

    $this->actingAs(superAdmin())
        ->post("/products/{$second->id}/plans", [
            'name' => 'Annual',
            'code' => 'ANN',
            'billing_cycle' => BillingCycle::Annual->value,
            'duration_days' => 365,
            'price' => '1000',
            'currency' => 'PKR',
            'grace_days' => 0,
        ])
        ->assertSessionHasNoErrors();

    expect(Plan::where('code', 'ANN')->count())->toBe(2);
});

it('rejects a duplicate plan code within the same product', function () {
    $product = Product::factory()->create();
    Plan::factory()->for($product)->create(['code' => 'ANN']);

    $this->actingAs(superAdmin())
        ->post("/products/{$product->id}/plans", [
            'name' => 'Annual again',
            'code' => 'ANN',
            'billing_cycle' => BillingCycle::Annual->value,
            'duration_days' => 365,
            'price' => '1000',
            'currency' => 'PKR',
            'grace_days' => 0,
        ])
        ->assertSessionHasErrors('code');
});

it('rejects an unsupported currency', function () {
    $product = Product::factory()->create();

    $this->actingAs(superAdmin())
        ->post("/products/{$product->id}/plans", [
            'name' => 'Annual',
            'code' => 'ANN',
            'billing_cycle' => BillingCycle::Annual->value,
            'duration_days' => 365,
            'price' => '1000',
            'currency' => 'XXX',
            'grace_days' => 0,
        ])
        ->assertSessionHasErrors('currency');
});

it('hides plan pricing from a role without the pricing permission', function () {
    $product = Product::factory()->create();
    Plan::factory()->for($product)->create();

    $this->actingAs(userWithRole('developer'))
        ->get("/products/{$product->id}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('can.viewPricing', false));

    $this->actingAs(userWithRole('accounts'))
        ->get("/products/{$product->id}")
        ->assertInertia(fn ($page) => $page->where('can.viewPricing', true));
});

it('archives a plan', function () {
    $plan = Plan::factory()->create();

    $this->actingAs(superAdmin())
        ->delete("/plans/{$plan->id}")
        ->assertRedirect();

    expect(Plan::count())->toBe(0)
        ->and(Plan::withTrashed()->count())->toBe(1);
});

it('blocks plan management for a role without the permission', function () {
    $product = Product::factory()->create();

    $this->actingAs(userWithRole('sales'))
        ->post("/products/{$product->id}/plans", [
            'name' => 'Annual',
            'code' => 'ANN',
            'billing_cycle' => BillingCycle::Annual->value,
            'duration_days' => 365,
            'price' => '1000',
            'currency' => 'PKR',
            'grace_days' => 0,
        ])
        ->assertForbidden();
});
