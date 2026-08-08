export interface AuthUser {
    id: number;
    name: string;
    email: string;
    job_title: string | null;
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
    | 'activity_log.view';

export interface SharedProps {
    app: { name: string };
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
    roles?: RoleRef[];
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
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
    roles?: RoleRef[];
}
