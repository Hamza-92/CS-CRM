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
    case ManageLeads = 'leads.manage';
    case ViewLeads = 'leads.view';
    case CreateLeads = 'leads.create';
    case EditLeads = 'leads.edit';
    case ArchiveLeads = 'leads.archive';
    case ConvertLeads = 'leads.convert';
    case ManageCustomers = 'customers.manage';
    case ViewCustomers = 'customers.view';
    case CreateCustomers = 'customers.create';
    case EditCustomers = 'customers.edit';
    case ArchiveCustomers = 'customers.archive';
    case ManageFollowUps = 'follow_ups.manage';
    case ViewFollowUps = 'follow_ups.view';
    case CreateFollowUps = 'follow_ups.create';
    case EditFollowUps = 'follow_ups.edit';
    case DeleteFollowUps = 'follow_ups.delete';
    case CompleteFollowUps = 'follow_ups.complete';
    case ManageDeals = 'deals.manage';
    case ViewDeals = 'deals.view';
    case CreateDeals = 'deals.create';
    case EditDeals = 'deals.edit';
    case ArchiveDeals = 'deals.archive';
    case ManageDealStages = 'deal_stages.manage';
    case ManageInstances = 'instances.manage';
    case ViewInstances = 'instances.view';
    case CreateInstances = 'instances.create';
    case EditInstances = 'instances.edit';
    case ArchiveInstances = 'instances.archive';
    case ManageSubscriptions = 'subscriptions.manage';
    case ViewSubscriptions = 'subscriptions.view';
    case CreateSubscriptions = 'subscriptions.create';
    case EditSubscriptions = 'subscriptions.edit';
    case ArchiveSubscriptions = 'subscriptions.archive';
    case ManagePayments = 'payments.manage';
    case ViewPayments = 'payments.view';
    case CreatePayments = 'payments.create';
    case EditPayments = 'payments.edit';
    case ArchivePayments = 'payments.archive';
    case ManageSupportTickets = 'support_tickets.manage';
    case ViewSupportTickets = 'support_tickets.view';
    case CreateSupportTickets = 'support_tickets.create';
    case EditSupportTickets = 'support_tickets.edit';
    case ArchiveSupportTickets = 'support_tickets.archive';

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
            self::ManageLeads => 'Manage leads',
            self::ViewLeads => 'View leads',
            self::CreateLeads => 'Create leads',
            self::EditLeads => 'Edit leads',
            self::ArchiveLeads => 'Archive leads',
            self::ConvertLeads => 'Convert leads',
            self::ManageCustomers => 'Manage customers',
            self::ViewCustomers => 'View customers',
            self::CreateCustomers => 'Create customers',
            self::EditCustomers => 'Edit customers',
            self::ArchiveCustomers => 'Archive customers',
            self::ManageFollowUps => 'Manage follow-ups',
            self::ViewFollowUps => 'View follow-ups',
            self::CreateFollowUps => 'Create follow-ups',
            self::EditFollowUps => 'Edit follow-ups',
            self::DeleteFollowUps => 'Delete follow-ups',
            self::CompleteFollowUps => 'Complete follow-ups',
            self::ManageDeals => 'Manage deals',
            self::ViewDeals => 'View deals',
            self::CreateDeals => 'Create deals',
            self::EditDeals => 'Edit deals',
            self::ArchiveDeals => 'Archive deals',
            self::ManageDealStages => 'Manage deal stages',
            self::ManageInstances => 'Manage application instances',
            self::ViewInstances => 'View application instances',
            self::CreateInstances => 'Create application instances',
            self::EditInstances => 'Edit application instances',
            self::ArchiveInstances => 'Archive application instances',
            self::ManageSubscriptions => 'Manage trials and subscriptions',
            self::ViewSubscriptions => 'View trials and subscriptions',
            self::CreateSubscriptions => 'Create trials and subscriptions',
            self::EditSubscriptions => 'Edit trials and subscriptions',
            self::ArchiveSubscriptions => 'Archive trials and subscriptions',
            self::ManagePayments => 'Manage payments',
            self::ViewPayments => 'View payments',
            self::CreatePayments => 'Create payments',
            self::EditPayments => 'Edit payments',
            self::ArchivePayments => 'Archive payments',
            self::ManageSupportTickets => 'Manage support tickets',
            self::ViewSupportTickets => 'View support tickets',
            self::CreateSupportTickets => 'Create support tickets',
            self::EditSupportTickets => 'Edit support tickets',
            self::ArchiveSupportTickets => 'Archive support tickets',
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
                self::ViewLeads, self::CreateLeads, self::EditLeads, self::ArchiveLeads, self::ConvertLeads,
                self::ViewCustomers, self::CreateCustomers, self::EditCustomers, self::ArchiveCustomers,
                self::ManageFollowUps, self::ViewFollowUps, self::CreateFollowUps, self::EditFollowUps, self::DeleteFollowUps, self::CompleteFollowUps,
                self::ManageDeals, self::ViewDeals, self::CreateDeals, self::EditDeals, self::ArchiveDeals, self::ManageDealStages,
                self::ViewInstances, self::CreateInstances, self::EditInstances, self::ArchiveInstances,
                self::ViewSubscriptions, self::CreateSubscriptions, self::EditSubscriptions, self::ArchiveSubscriptions,
                self::ViewPayments, self::CreatePayments, self::EditPayments, self::ArchivePayments,
                self::ViewSupportTickets, self::CreateSupportTickets, self::EditSupportTickets, self::ArchiveSupportTickets,
            ],
            RoleName::Sales->value => [
                self::ViewProducts,
                self::ViewPlans, self::ViewPlanPricing,
                self::ViewLeads, self::CreateLeads, self::EditLeads, self::ConvertLeads,
                self::ViewCustomers, self::CreateCustomers, self::EditCustomers,
                self::ViewFollowUps, self::CreateFollowUps, self::EditFollowUps, self::CompleteFollowUps,
                self::ViewDeals, self::CreateDeals, self::EditDeals,
                self::ViewInstances, self::CreateInstances, self::EditInstances,
                self::ViewSubscriptions, self::CreateSubscriptions, self::EditSubscriptions,
                self::ViewPayments, self::CreatePayments, self::EditPayments,
                self::ViewSupportTickets, self::CreateSupportTickets, self::EditSupportTickets,
            ],
            RoleName::Developer->value => [
                self::ViewProducts,
                self::ViewPlans,
                self::ViewCustomers, self::ViewInstances, self::EditInstances,
                self::ViewSubscriptions, self::EditSubscriptions,
                self::ViewPayments, self::EditPayments,
                self::ViewSupportTickets, self::EditSupportTickets,
            ],
            RoleName::Support->value => [
                self::ViewProducts,
                self::ViewPlans,
                self::ViewCustomers,
                self::ViewFollowUps, self::CreateFollowUps, self::EditFollowUps, self::CompleteFollowUps,
                self::ViewInstances, self::EditInstances,
                self::ViewSubscriptions, self::EditSubscriptions,
                self::ViewPayments, self::EditPayments,
                self::ViewSupportTickets, self::EditSupportTickets,
            ],
            RoleName::Qa->value => [
                self::ViewProducts,
                self::ViewInstances,
                self::ViewSubscriptions,
                self::ViewPayments,
                self::ViewSupportTickets,
            ],
            RoleName::Accounts->value => [
                self::ViewProducts,
                self::ViewPlans, self::ViewPlanPricing,
                self::ViewCustomers,
                self::ViewFollowUps,
                self::ViewDeals,
                self::ViewInstances,
                self::ViewSubscriptions,
                self::ViewPayments,
                self::ViewSupportTickets,
            ],
            RoleName::Management->value => [
                self::ViewProducts,
                self::ViewPlans, self::ViewPlanPricing,
                self::ViewUsers,
                self::ViewActivityLog,
                self::ViewLeads, self::ViewCustomers,
                self::ViewFollowUps,
                self::ViewDeals,
                self::ViewInstances,
                self::ViewSubscriptions,
                self::ViewPayments,
                self::ViewSupportTickets,
            ],
        ];
    }
}
