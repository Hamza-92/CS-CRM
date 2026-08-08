<?php

use App\Enums\Permission as PermissionEnum;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        foreach (PermissionEnum::roleMatrix() as $roleName => $permissions) {
            $role = Role::query()->where('name', $roleName)->where('guard_name', 'web')->first();
            if (! $role) continue;
            $role->givePermissionTo(collect($permissions)->map->value->filter(fn ($permission) => str_starts_with($permission, 'instances.'))->all());
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void {}
};
