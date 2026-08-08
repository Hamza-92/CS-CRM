<?php

use Illuminate\Database\Migrations\Migration;
use App\Enums\Permission as PermissionEnum;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        foreach (['instances.manage', 'instances.view', 'instances.create', 'instances.edit', 'instances.archive'] as $name) Permission::findOrCreate($name, 'web');
        foreach (PermissionEnum::roleMatrix() as $roleName => $permissions) {
            $role = Role::query()->where('name', $roleName)->where('guard_name', 'web')->first();
            if (! $role) continue;
            $role->givePermissionTo(collect($permissions)->map->value->filter(fn ($permission) => in_array($permission, ['instances.manage', 'instances.view', 'instances.create', 'instances.edit', 'instances.archive'], true))->all());
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        DB::table('permissions')->where('guard_name', 'web')->whereIn('name', ['instances.manage', 'instances.view', 'instances.create', 'instances.edit', 'instances.archive'])->delete();
    }
};
