<?php

use App\Enums\RoleName;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->beforeEach(fn () => $this->seed(RolePermissionSeeder::class))
    ->in('Feature');

function userWithRole(RoleName|string $role, array $attributes = []): User
{
    $user = User::factory()->create($attributes);
    $user->syncRoles([$role instanceof RoleName ? $role->value : $role]);

    return $user->fresh();
}

function superAdmin(array $attributes = []): User
{
    return userWithRole(RoleName::SuperAdmin, $attributes);
}
