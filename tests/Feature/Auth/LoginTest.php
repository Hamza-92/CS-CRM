<?php

use App\Models\Activity;
use App\Models\User;

it('shows the login screen to guests', function () {
    $this->get('/login')->assertOk();
});

it('redirects guests away from protected pages', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

it('signs a user in with valid credentials', function () {
    $user = userWithRole('admin', ['password' => 'correct-horse']);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'correct-horse',
    ])->assertRedirect('/dashboard');

    $this->assertAuthenticatedAs($user);
});

it('rejects invalid credentials', function () {
    $user = userWithRole('admin', ['password' => 'correct-horse']);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('refuses to sign in a deactivated user', function () {
    $user = userWithRole('admin', ['password' => 'correct-horse', 'is_active' => false]);

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'correct-horse',
    ])->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('signs out a user who is deactivated mid-session', function () {
    $user = userWithRole('admin');

    $this->actingAs($user)->get('/dashboard')->assertOk();

    $user->update(['is_active' => false]);

    $this->actingAs($user)->get('/dashboard')->assertRedirect('/login');
    $this->assertGuest();
});

it('records the sign-in time and an audit event', function () {
    $user = userWithRole('admin', ['password' => 'correct-horse']);

    expect($user->last_login_at)->toBeNull();

    $this->post('/login', ['email' => $user->email, 'password' => 'correct-horse']);

    expect($user->fresh()->last_login_at)->not->toBeNull();
    expect(Activity::where('event', 'auth.login')->where('user_id', $user->id)->exists())->toBeTrue();
});

it('throttles repeated failed attempts', function () {
    $user = User::factory()->create();

    foreach (range(1, 5) as $ignored) {
        $this->post('/login', ['email' => $user->email, 'password' => 'wrong']);
    }

    $this->post('/login', ['email' => $user->email, 'password' => 'wrong'])
        ->assertSessionHasErrors('email');

    expect(session('errors')->first('email'))->toContain('seconds');
});

it('logs the user out', function () {
    $user = userWithRole('admin');

    $this->actingAs($user)->post('/logout')->assertRedirect('/login');

    $this->assertGuest();
});

it('does not expose a registration route', function () {
    $this->get('/register')->assertNotFound();
});
