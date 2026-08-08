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

it('redirects the root and legacy dashboard route to users', function () {
    $this->actingAs(superAdmin())->get('/')->assertRedirect('/users');
    $this->actingAs(superAdmin())->get('/dashboard')->assertRedirect('/users');
});
