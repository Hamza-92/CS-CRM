<?php

namespace Database\Seeders;

use App\Enums\Permission as PermissionEnum;
use App\Enums\RoleName;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (PermissionEnum::cases() as $permission) {
            Permission::findOrCreate($permission->value, 'web');
        }

        $matrix = PermissionEnum::roleMatrix();

        foreach (RoleName::cases() as $roleName) {
            $role = Role::findOrCreate($roleName->value, 'web');

            if ($roleName === RoleName::SuperAdmin) {
                continue;
            }

            $role->syncPermissions(
                array_map(
                    fn (PermissionEnum $permission) => $permission->value,
                    $matrix[$roleName->value] ?? [],
                ),
            );
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
