<?php

it('renders the active users workspace', function () {
    $this->actingAs(superAdmin())
        ->get('/users')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('users/index'));
});

it('renders the login screen', function () {
    $this->get('/login')->assertOk()->assertInertia(fn ($page) => $page->component('auth/login'));
});

it('redirects the root to the operational dashboard', function () {
    $this->actingAs(superAdmin())->get('/')->assertRedirect('/dashboard');
    $this->actingAs(superAdmin())->get('/dashboard')->assertOk();
});

it('renders the personal work queue', function () {
    $this->actingAs(superAdmin())
        ->get('/my-work')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('my-work/index')->has('items')->has('stats'));
});

it('searches permitted CRM records from the global endpoint', function () {
    \App\Models\Product::factory()->create(['name' => 'Counter POS', 'code' => 'CPOS']);

    $this->actingAs(superAdmin())
        ->getJson('/search?q=Counter')
        ->assertOk()
        ->assertJsonPath('results.0.type', 'Product')
        ->assertJsonPath('results.0.label', 'Counter POS');
});
