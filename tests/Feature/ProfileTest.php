<?php

use App\Models\Activity;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('shows the profile page to any signed-in user', function () {
    $this->actingAs(userWithRole('qa'))
        ->get('/profile')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('profile/edit'));
});

it('redirects guests away from the profile page', function () {
    $this->get('/profile')->assertRedirect('/login');
});

it('updates the signed-in user own details', function () {
    $user = userWithRole('sales', ['name' => 'Old Name']);

    $this->actingAs($user)
        ->put('/profile', [
            'name' => 'New Name',
            'email' => $user->email,
            'job_title' => 'Sales Manager',
            'phone' => '0300 1234567',
        ])
        ->assertRedirect();

    expect($user->fresh()->name)->toBe('New Name')
        ->and($user->fresh()->job_title)->toBe('Sales Manager');
});

it('rejects an email already used by someone else', function () {
    $other = User::factory()->create(['email' => 'taken@example.test']);
    $user = userWithRole('sales');

    $this->actingAs($user)
        ->put('/profile', ['name' => $user->name, 'email' => $other->email])
        ->assertSessionHasErrors('email');
});

it('lets a user keep their own email', function () {
    $user = userWithRole('sales');

    $this->actingAs($user)
        ->put('/profile', ['name' => $user->name, 'email' => $user->email])
        ->assertSessionHasNoErrors();
});

it('changes the password when the current one is correct', function () {
    $user = userWithRole('sales', ['password' => 'old-password-123']);

    $this->actingAs($user)
        ->put('/profile/password', [
            'current_password' => 'old-password-123',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertSessionHasNoErrors();

    expect(Hash::check('brand-new-password', $user->fresh()->password))->toBeTrue();
});

it('refuses a password change when the current password is wrong', function () {
    $user = userWithRole('sales', ['password' => 'old-password-123']);

    $this->actingAs($user)
        ->put('/profile/password', [
            'current_password' => 'not-my-password',
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])
        ->assertSessionHasErrors('current_password');

    expect(Hash::check('old-password-123', $user->fresh()->password))->toBeTrue();
});

it('requires the new password to be confirmed', function () {
    $user = userWithRole('sales', ['password' => 'old-password-123']);

    $this->actingAs($user)
        ->put('/profile/password', [
            'current_password' => 'old-password-123',
            'password' => 'brand-new-password',
            'password_confirmation' => 'something-else',
        ])
        ->assertSessionHasErrors('password');
});

it('audits a password change without recording the password', function () {
    $user = userWithRole('sales', ['password' => 'old-password-123']);

    $this->actingAs($user)->put('/profile/password', [
        'current_password' => 'old-password-123',
        'password' => 'brand-new-password',
        'password_confirmation' => 'brand-new-password',
    ]);

    $activity = Activity::where('event', 'user.password_changed')->first();

    expect($activity)->not->toBeNull()
        ->and($activity->user_id)->toBe($user->id)
        ->and(json_encode($activity->properties))->not->toContain('brand-new-password');
});
