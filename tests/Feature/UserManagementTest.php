<?php

use App\Enums\RoleName;
use App\Models\Activity;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

it('creates a user with a single role', function () {
    $this->actingAs(superAdmin())
        ->post('/users', [
            'name' => 'Dev One',
            'email' => 'dev@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => RoleName::Developer->value,
        ])
        ->assertRedirect();

    $user = User::firstWhere('email', 'dev@example.test');

    expect($user)->not->toBeNull()
        ->and($user->hasRole(RoleName::Developer->value))->toBeTrue();
});

it('requires a role', function () {
    $this->actingAs(superAdmin())
        ->post('/users', [
            'name' => 'Dev One',
            'email' => 'dev@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])
        ->assertSessionHasErrors('role');
});

it('rejects an unknown role', function () {
    $this->actingAs(superAdmin())
        ->post('/users', [
            'name' => 'Dev One',
            'email' => 'dev@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'emperor',
        ])
        ->assertSessionHasErrors('role');
});

it('never writes the password into the audit log', function () {
    $this->actingAs(superAdmin())
        ->post('/users', [
            'name' => 'Dev One',
            'email' => 'dev@example.test',
            'password' => 'sup3r-s3cret-value',
            'password_confirmation' => 'sup3r-s3cret-value',
            'role' => RoleName::Developer->value,
        ]);

    $activity = Activity::where('event', 'user.created')->latest('id')->first();

    expect(json_encode($activity->properties))->not->toContain('sup3r-s3cret-value')
        ->and($activity->properties['new'])->not->toHaveKey('password');
});

it('rejects a mismatched password confirmation', function () {
    $this->actingAs(superAdmin())
        ->post('/users', [
            'name' => 'Dev One',
            'email' => 'dev@example.test',
            'password' => 'password123',
            'password_confirmation' => 'different456',
            'role' => RoleName::Developer->value,
        ])
        ->assertSessionHasErrors('password');
});

it('rejects a duplicate email', function () {
    User::factory()->create(['email' => 'taken@example.test']);

    $this->actingAs(superAdmin())
        ->post('/users', [
            'name' => 'Dev One',
            'email' => 'taken@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => RoleName::Developer->value,
        ])
        ->assertSessionHasErrors('email');
});

it('updates a user and swaps their role', function () {
    $user = userWithRole(RoleName::Developer);

    $this->actingAs(superAdmin())
        ->put("/users/{$user->id}", [
            'name' => 'Renamed',
            'email' => $user->email,
            'role' => RoleName::Support->value,
        ])
        ->assertRedirect();

    $fresh = $user->fresh();

    expect($fresh->name)->toBe('Renamed')
        ->and($fresh->hasRole(RoleName::Support->value))->toBeTrue()
        ->and($fresh->hasRole(RoleName::Developer->value))->toBeFalse();
});

it('does not touch the password on update', function () {
    $user = userWithRole(RoleName::Developer, ['password' => 'original-password']);
    $hash = $user->password;

    $this->actingAs(superAdmin())->put("/users/{$user->id}", [
        'name' => 'Renamed',
        'email' => $user->email,
        'role' => RoleName::Developer->value,
    ]);

    expect($user->fresh()->password)->toBe($hash);
});

it('stops a non super admin from granting the super admin role', function () {
    $admin = userWithRole(RoleName::Admin);
    $admin->givePermissionTo(['users.manage', 'roles.manage']);

    $this->actingAs($admin)
        ->post('/users', [
            'name' => 'Escalation',
            'email' => 'escalate@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => RoleName::SuperAdmin->value,
        ])
        ->assertSessionHasErrors('role');

    expect(User::where('email', 'escalate@example.test')->exists())->toBeFalse();
});

it('stops a non super admin from editing a super admin', function () {
    $admin = userWithRole(RoleName::Admin);
    $admin->givePermissionTo(['users.manage']);
    $target = superAdmin();

    $this->actingAs($admin)
        ->put("/users/{$target->id}", [
            'name' => 'Hijacked',
            'email' => $target->email,
            'role' => RoleName::Admin->value,
        ])
        ->assertForbidden();
});

it('resets another user password', function () {
    $user = userWithRole(RoleName::Developer, ['password' => 'old-password']);

    $this->actingAs(superAdmin())
        ->put("/users/{$user->id}/password", [
            'password' => 'issued-password-1',
            'password_confirmation' => 'issued-password-1',
        ])
        ->assertSessionHasNoErrors();

    expect(Hash::check('issued-password-1', $user->fresh()->password))->toBeTrue();
    expect(Activity::where('event', 'user.password_reset')->exists())->toBeTrue();
});

it('requires confirmation when resetting a password', function () {
    $user = userWithRole(RoleName::Developer);

    $this->actingAs(superAdmin())
        ->put("/users/{$user->id}/password", [
            'password' => 'issued-password-1',
            'password_confirmation' => 'mismatch',
        ])
        ->assertSessionHasErrors('password');
});

it('toggles a user status', function () {
    $user = userWithRole(RoleName::Developer, ['is_active' => true]);

    $this->actingAs(superAdmin())->patch("/users/{$user->id}/status")->assertRedirect();
    expect($user->fresh()->is_active)->toBeFalse();

    $this->actingAs(superAdmin())->patch("/users/{$user->id}/status");
    expect($user->fresh()->is_active)->toBeTrue();
});

it('prevents toggling your own status', function () {
    $admin = superAdmin();

    $this->actingAs($admin)->patch("/users/{$admin->id}/status")->assertForbidden();

    expect($admin->fresh()->is_active)->toBeTrue();
});

it('soft deletes a user so the audit trail keeps its actor', function () {
    $user = userWithRole(RoleName::Developer);
    $activityId = Activity::where('subject_id', $user->id)->where('event', 'user.created')->value('id');

    $this->actingAs(superAdmin())
        ->delete("/users/{$user->id}")
        ->assertRedirect();

    expect(User::whereKey($user->id)->exists())->toBeFalse()
        ->and(User::withTrashed()->whereKey($user->id)->exists())->toBeTrue()
        ->and(Activity::whereKey($activityId)->exists())->toBeTrue();
});

it('prevents deleting your own account', function () {
    $admin = superAdmin();

    $this->actingAs($admin)->delete("/users/{$admin->id}")->assertForbidden();

    expect(User::whereKey($admin->id)->exists())->toBeTrue();
});

it('stops a deleted user from signing in', function () {
    $user = userWithRole(RoleName::Developer, ['password' => 'known-password']);
    $user->delete();

    $this->post('/login', ['email' => $user->email, 'password' => 'known-password'])
        ->assertSessionHasErrors('email');

    $this->assertGuest();
});

it('denies user management to roles without the permission', function () {
    $this->actingAs(userWithRole('sales'))->get('/users')->assertForbidden();
    $this->actingAs(userWithRole('management'))->get('/users')->assertOk();
    $this->actingAs(userWithRole('management'))
        ->post('/users', ['name' => 'x', 'email' => 'x@example.test'])
        ->assertForbidden();
});
