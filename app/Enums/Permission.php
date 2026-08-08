<?php

namespace App\Enums;

enum Permission: string
{
    case ManageProducts = 'products.manage'; // Legacy broad access; kept for existing assignments.
    case ViewProducts = 'products.view';
    case CreateProducts = 'products.create';
    case EditProducts = 'products.edit';
    case ArchiveProducts = 'products.archive';
    case ManagePlans = 'plans.manage'; // Legacy broad access; kept for existing assignments.
    case ViewPlans = 'plans.view';
    case CreatePlans = 'plans.create';
    case EditPlans = 'plans.edit';
    case ArchivePlans = 'plans.archive';
    case ViewPlanPricing = 'plans.pricing.view';
    case ManageUsers = 'users.manage'; // Legacy broad access; kept for existing assignments.
    case ViewUsers = 'users.view';
    case CreateUsers = 'users.create';
    case EditUsers = 'users.edit';
    case DeleteUsers = 'users.delete';
    case ResetUserPasswords = 'users.password.reset';
    case ChangeUserStatus = 'users.status.change';
    case ManageRoles = 'roles.manage';
    case ViewRoles = 'roles.view';
    case CreateRoles = 'roles.create';
    case EditRoles = 'roles.edit';
    case DeleteRoles = 'roles.delete';
    case ViewActivityLog = 'activity_log.view';

    public function label(): string
    {
        return match ($this) {
            self::ViewProducts => 'View products',
            self::ManageProducts => 'Manage products',
            self::CreateProducts => 'Create products',
            self::EditProducts => 'Edit products',
            self::ArchiveProducts => 'Archive products',
            self::ViewPlans => 'View plans',
            self::ManagePlans => 'Manage plans',
            self::CreatePlans => 'Create plans',
            self::EditPlans => 'Edit plans',
            self::ArchivePlans => 'Archive plans',
            self::ViewPlanPricing => 'View plan pricing',
            self::ViewUsers => 'View users',
            self::ManageUsers => 'Manage users',
            self::CreateUsers => 'Create users',
            self::EditUsers => 'Edit users',
            self::DeleteUsers => 'Delete users',
            self::ResetUserPasswords => 'Reset password users',
            self::ChangeUserStatus => 'Change status users',
            self::ManageRoles => 'Manage roles',
            self::ViewRoles => 'View roles',
            self::CreateRoles => 'Create roles',
            self::EditRoles => 'Edit roles',
            self::DeleteRoles => 'Delete roles',
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
                self::ViewProducts, self::CreateProducts, self::EditProducts, self::ArchiveProducts,
                self::ViewPlans, self::CreatePlans, self::EditPlans, self::ArchivePlans, self::ViewPlanPricing,
                self::ViewUsers, self::CreateUsers, self::EditUsers, self::DeleteUsers,
                self::ResetUserPasswords, self::ChangeUserStatus,
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
