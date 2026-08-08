<?php

use App\Models\Plan;
use App\Models\Product;

it('renders every Phase 1 screen', function (string $method, callable $url, string $component) {
    $product = Product::factory()->create();
    Plan::factory()->for($product)->create();

    $this->actingAs(superAdmin())
        ->{$method}($url($product, $product->plans->first()))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component($component));
})->with([
    'dashboard' => ['get', fn () => '/dashboard', 'dashboard'],
    'products index' => ['get', fn () => '/products', 'products/index'],
    'products create' => ['get', fn () => '/products/create', 'products/create'],
    'products show' => ['get', fn (Product $p) => "/products/{$p->id}", 'products/show'],
    'products edit' => ['get', fn (Product $p) => "/products/{$p->id}/edit", 'products/edit'],
    'plans create' => ['get', fn (Product $p) => "/products/{$p->id}/plans/create", 'plans/create'],
    'plans edit' => ['get', fn (Product $p, Plan $plan) => "/plans/{$plan->id}/edit", 'plans/edit'],
    'users index' => ['get', fn () => '/users', 'users/index'],
    'activity index' => ['get', fn () => '/activity', 'activity/index'],
]);

it('renders the login screen', function () {
    $this->get('/login')->assertOk()->assertInertia(fn ($page) => $page->component('auth/login'));
});

it('redirects the root to the dashboard', function () {
    $this->actingAs(superAdmin())->get('/')->assertRedirect('/dashboard');
});
