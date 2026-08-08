<?php

use App\Enums\Permission as PermissionEnum;
use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    private array $permissions = ['support_tickets.manage', 'support_tickets.view', 'support_tickets.create', 'support_tickets.edit', 'support_tickets.archive'];

    public function up(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        foreach ($this->permissions as $permission) Permission::findOrCreate($permission, 'web');
        foreach (PermissionEnum::roleMatrix() as $roleName => $permissions) {
            $role = Role::query()->where('name', $roleName)->where('guard_name', 'web')->first();
            if (! $role) continue;
            $role->givePermissionTo(collect($permissions)->map->value->filter(fn ($permission) => in_array($permission, $this->permissions, true))->all());
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        Permission::query()->where('guard_name', 'web')->whereIn('name', $this->permissions)->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
