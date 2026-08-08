export interface AuthUser {
    id: number;
    name: string;
    email: string;
    job_title: string | null;
    avatar_url: string | null;
    roles: string[];
}

export type Ability =
    | 'products.view'
    | 'products.manage'
    | 'products.create'
    | 'products.edit'
    | 'products.archive'
    | 'plans.view'
    | 'plans.manage'
    | 'plans.create'
    | 'plans.edit'
    | 'plans.archive'
    | 'plans.pricing.view'
    | 'users.view'
    | 'users.manage'
    | 'users.create'
    | 'users.edit'
    | 'users.delete'
    | 'users.password.reset'
    | 'users.status.change'
    | 'roles.manage'
    | 'roles.view'
    | 'roles.create'
    | 'roles.edit'
    | 'roles.delete'
    | 'activity_log.view'
    | 'leads.manage'
    | 'leads.view'
    | 'leads.create'
    | 'leads.edit'
    | 'leads.archive'
    | 'leads.convert'
    | 'customers.manage'
    | 'customers.view'
    | 'customers.create'
    | 'customers.edit'
    | 'customers.archive'
    | 'follow_ups.manage'
    | 'follow_ups.view'
    | 'follow_ups.create'
    | 'follow_ups.edit'
    | 'follow_ups.delete'
    | 'follow_ups.complete'
    | 'deals.manage'
    | 'deals.view'
    | 'deals.create'
    | 'deals.edit'
    | 'deals.archive'
    | 'deal_stages.manage'
    | 'instances.manage'
    | 'instances.view'
    | 'instances.create'
    | 'instances.edit'
    | 'instances.archive'
    | 'subscriptions.manage'
    | 'subscriptions.view'
    | 'subscriptions.create'
    | 'subscriptions.edit'
    | 'subscriptions.archive';

export interface SharedProps {
    app: { name: string; theme: 'light' | 'dark' };
    auth: {
        user: AuthUser | null;
        can: Partial<Record<Ability, boolean>>;
    };
    flash: {
        success: string | null;
        error: string | null;
        warning?: string | null;
        info?: string | null;
    };
    [key: string]: unknown;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Paginated<T> {
    data: T[];
    links: PaginationLink[];
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
}

export interface RoleRef {
    id: number;
    name: string;
}

export interface UserRef {
    id: number;
    name: string;
    email?: string;
    avatar_url?: string | null;
    roles?: RoleRef[];
}

export interface ProductRef {
    id: number;
    name: string;
    code: string;
}

export interface ApplicationInstance {
    id: number;
    customer_id: number;
    product_id: number;
    owner_id: number | null;
    name: string;
    environment: 'demo' | 'staging' | 'production' | 'sandbox';
    environment_label?: string;
    status: 'planned' | 'active' | 'paused' | 'retired';
    status_label?: string;
    deployment_url: string | null;
    server_name: string | null;
    version: string | null;
    deployed_at: string | null;
    last_checked_at: string | null;
    notes: string | null;
    customer: { id: number; name: string; business: string | null; email?: string | null } | null;
    product: { id: number; name: string; code: string; brand_color?: string | null } | null;
    owner: UserRef | null;
    follow_ups_count?: number;
    subscriptions?: Array<{ id: number; status: string; status_label?: string; kind: string; ends_at: string | null; renewal_at: string | null; plan?: { id: number; name: string; code: string } | null }>;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Lead {
    id: number;
    name: string;
    business: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    city: string | null;
    source: string | null;
    source_label: string | null;
    status: string;
    status_label: string;
    status_color?: string;
    owner_id: number | null;
    owner: UserRef | null;
    interested_products: number[];
    next_follow_up_at: string | null;
    notes: string | null;
    customer_id: number | null;
    customer: { id: number; name: string; business: string | null } | null;
    converted_at: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Customer {
    id: number;
    name: string;
    business: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    city: string | null;
    source: string | null;
    source_label: string | null;
    status: 'active' | 'inactive';
    owner_id: number | null;
    owner: UserRef | null;
    tags: string[];
    notes: string | null;
    last_contacted_at: string | null;
    converted_from_lead_id: number | null;
    leads_count: number;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface FollowUp {
    id: number;
    lead_id: number | null;
    customer_id: number | null;
    deal_id: number | null;
    application_instance_id: number | null;
    reason: string;
    notes: string | null;
    owner_id: number | null;
    owner: UserRef | null;
    scheduled_at: string;
    status: 'pending' | 'completed' | 'rescheduled' | 'cancelled';
    status_label: string;
    is_overdue: boolean;
    completed_at: string | null;
    subject: { id: number; name: string; business: string | null; type: 'lead' | 'customer' | 'deal' | 'instance' } | null;
    created_at: string;
    updated_at: string;
}

export interface DealStage {
    id: number;
    name: string;
    slug: string;
    color: string;
    probability: number;
    status?: 'active' | 'inactive';
    is_won: boolean;
    is_lost: boolean;
    sort_order?: number;
    deals_count?: number;
}

export interface Deal {
    id: number;
    title: string;
    lead_id: number | null;
    customer_id: number | null;
    product_id: number | null;
    plan_id: number | null;
    stage_id: number;
    owner_id: number | null;
    amount: string;
    currency: string;
    probability: number;
    expected_close_date: string | null;
    next_step: string | null;
    notes: string | null;
    loss_reason: string | null;
    won_at: string | null;
    lost_at: string | null;
    lead: { id: number; name: string; business: string | null } | null;
    customer: { id: number; name: string; business: string | null } | null;
    product: { id: number; name: string; code: string; brand_color?: string | null } | null;
    plan: { id: number; name: string; code: string } | null;
    stage: DealStage | null;
    owner: UserRef | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface RoleOption {
    value: string;
    label: string;
    description: string;
}

export interface PermissionDefinition {
    value: string;
    label: string;
    group: string;
}

export interface ManagedRole {
    id: number;
    name: string;
    label: string;
    is_system: boolean;
    is_protected: boolean;
    users_count: number;
    permissions_count: number;
    permission_names: string[];
    updated_at: string | null;
}

export interface BillingCycleOption {
    value: string;
    label: string;
    default_duration_days: number | null;
}

export interface Product {
    id: number;
    name: string;
    code: string;
    brand_color: string | null;
    description: string | null;
    is_active: boolean;
    technical_owner_id: number | null;
    support_role_id: number | null;
    default_trial_days: number | null;
    demo_notes: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    technical_owner?: UserRef | null;
    support_role?: RoleRef | null;
    plans_count?: number;
}

export interface Plan {
    id: number;
    product_id: number;
    name: string;
    code: string;
    billing_cycle: string;
    duration_days: number | null;
    price: string;
    currency: string;
    grace_days: number;
    is_active: boolean;
    sort_order: number;
    deleted_at: string | null;
}

export interface Subscription {
    id: number;
    application_instance_id: number;
    plan_id: number;
    kind: 'trial' | 'subscription';
    kind_label?: string;
    status: 'trialing' | 'active' | 'past_due' | 'paused' | 'expired' | 'cancelled';
    status_label?: string;
    starts_at: string;
    ends_at: string | null;
    renewal_at: string | null;
    grace_ends_at: string | null;
    cancelled_at: string | null;
    auto_renew: boolean;
    external_reference: string | null;
    notes: string | null;
    days_remaining?: number | null;
    is_expired?: boolean;
    application_instance: ApplicationInstance | null;
    plan: Plan | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export interface Activity {
    id: number;
    event: string;
    description: string | null;
    subject_type: string | null;
    subject_id: number | null;
    user_id: number | null;
    properties: {
        old?: Record<string, unknown>;
        new?: Record<string, unknown>;
    } | null;
    ip_address: string | null;
    created_at: string;
    user?: UserRef | null;
}

export interface ManagedUser {
    id: number;
    name: string;
    email: string;
    job_title: string | null;
    phone: string | null;
    avatar_url: string | null;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    roles?: RoleRef[];
}
