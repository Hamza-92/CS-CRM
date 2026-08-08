<?php

namespace App\Enums;

enum RoleName: string
{
    case SuperAdmin = 'super_admin';
    case Admin = 'admin';
    case Sales = 'sales';
    case Developer = 'developer';
    case Support = 'support';
    case Qa = 'qa';
    case Accounts = 'accounts';
    case Management = 'management';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Admin => 'Admin / Operations',
            self::Sales => 'Sales',
            self::Developer => 'Developer',
            self::Support => 'Support',
            self::Qa => 'QA',
            self::Accounts => 'Accounts',
            self::Management => 'Read-only / Management',
        };
    }

    public function description(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Full system configuration, users, permissions, products, rules, sensitive settings.',
            self::Admin => 'Manage leads, customers, tasks, subscriptions, general operations and reports.',
            self::Sales => 'Leads, follow-ups, customer communication, demos, conversion and renewal follow-up.',
            self::Developer => 'Deployments, technical tasks, bugs, feature implementation, version/deployment information.',
            self::Support => 'Support requests, customer assistance, issue triage, basic operational tasks.',
            self::Qa => 'Testing tasks, validation of bug fixes/features, release readiness.',
            self::Accounts => 'Payments, dues, invoices/receipts later, financial reporting, renewal payment verification.',
            self::Management => 'Dashboards, reports and selected records without operational changes.',
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
