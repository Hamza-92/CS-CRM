<?php

namespace App\Enums;

enum Permission: string
{
    case ViewProducts = 'products.view';
    case ManageProducts = 'products.manage';
    case ViewPlans = 'plans.view';
    case ManagePlans = 'plans.manage';
    case ViewPlanPricing = 'plans.pricing.view';
    case ViewUsers = 'users.view';
    case ManageUsers = 'users.manage';
    case ManageRoles = 'roles.manage';
    case ViewActivityLog = 'activity_log.view';

    public function label(): string
    {
        return match ($this) {
            self::ViewProducts => 'View products',
            self::ManageProducts => 'Create, edit and archive products',
            self::ViewPlans => 'View plans',
            self::ManagePlans => 'Create, edit and archive plans',
            self::ViewPlanPricing => 'View plan pricing',
            self::ViewUsers => 'View users',
            self::ManageUsers => 'Create, edit and deactivate users',
            self::ManageRoles => 'Assign roles and permissions',
            self::ViewActivityLog => 'View the activity / audit log',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return array<string, array<int, self>>
     */
    public static function roleMatrix(): array
    {
        return [
            RoleName::Admin->value => [
                self::ViewProducts, self::ManageProducts,
                self::ViewPlans, self::ManagePlans, self::ViewPlanPricing,
                self::ViewUsers,
                self::ViewActivityLog,
            ],
            RoleName::Sales->value => [
                self::ViewProducts,
                self::ViewPlans, self::ViewPlanPricing,
            ],
            RoleName::Developer->value => [
                self::ViewProducts,
                self::ViewPlans,
            ],
            RoleName::Support->value => [
                self::ViewProducts,
                self::ViewPlans,
            ],
            RoleName::Qa->value => [
                self::ViewProducts,
            ],
            RoleName::Accounts->value => [
                self::ViewProducts,
                self::ViewPlans, self::ViewPlanPricing,
            ],
            RoleName::Management->value => [
                self::ViewProducts,
                self::ViewPlans, self::ViewPlanPricing,
                self::ViewUsers,
                self::ViewActivityLog,
            ],
        ];
    }
}
