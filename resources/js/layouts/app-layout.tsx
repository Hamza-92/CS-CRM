import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    Boxes,
    CalendarClock,
    ChevronDown,
    ContactRound,
    CreditCard,
    Globe2,
    Handshake,
    GitBranch,
    KeyRound,
    LifeBuoy,
    ListChecks,
    PanelLeftClose,
    PanelLeftOpen,
    ReceiptText,
    Search,
    Moon,
    Sun,
    Tag,
    UserRoundSearch,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Flash } from '@/components/flash';
import { ToastProvider } from '@/components/toast';
import { UserMenu } from '@/components/user-menu';
import { Wordmark, WordmarkBadge } from '@/components/wordmark';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import type { Ability, SharedProps } from '@/types';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'crm.sidebar.collapsed';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    ability?: Ability;
    match: (path: string) => boolean;
}

interface NavGroup {
    label: string;
    items: NavItem[];
    icon?: LucideIcon;
    collapsible?: boolean;
}

const groups: NavGroup[] = [
    {
        label: 'Catalog',
        items: [
            { label: 'Products', href: '/products', icon: Boxes, ability: 'products.view', match: (p) => p.startsWith('/products') || p.startsWith('/plans') },
        ],
    },
    {
        label: 'Administration',
        items: [
            { label: 'Users', href: '/users', icon: Users, ability: 'users.view', match: (p) => p.startsWith('/users') },
            { label: 'Roles & Permissions', href: '/roles', icon: KeyRound, ability: 'roles.manage', match: (p) => p.startsWith('/roles') },
        ],
    },
    {
        label: 'Customer operations',
        items: [
            { label: 'Customers', href: '/customers', icon: ContactRound, ability: 'customers.view', match: (p) => p.startsWith('/customers') },
            { label: 'Instances', href: '/instances', icon: Boxes, ability: 'instances.view', match: (p) => p.startsWith('/instances') },
            { label: 'Subscriptions', href: '/subscriptions', icon: ReceiptText, ability: 'subscriptions.view', match: (p) => p.startsWith('/subscriptions') },
            { label: 'Payments', href: '/payments', icon: CreditCard, ability: 'payments.view', match: (p) => p.startsWith('/payments') },
            { label: 'Support Tickets', href: '/support-tickets', icon: LifeBuoy, ability: 'support_tickets.view', match: (p) => p.startsWith('/support-tickets') },
            { label: 'Tasks', href: '/tasks', icon: ListChecks, ability: 'tasks.view', match: (p) => p.startsWith('/tasks') },
            { label: 'Follow-ups', href: '/follow-ups', icon: CalendarClock, ability: 'follow_ups.view', match: (p) => p.startsWith('/follow-ups') },
        ],
    },
    {
        label: 'Lead Management',
        icon: UserRoundSearch,
        collapsible: true,
        items: [
            { label: 'Leads', href: '/leads', icon: UserRoundSearch, ability: 'leads.view', match: (p) => p.startsWith('/leads') },
            { label: 'Lead Sources', href: '/lead-sources', icon: Globe2, ability: 'leads.manage', match: (p) => p.startsWith('/lead-sources') },
            { label: 'Lead Status', href: '/lead-statuses', icon: Tag, ability: 'leads.manage', match: (p) => p.startsWith('/lead-statuses') },
        ],
    },
    {
        label: 'Sales Pipeline',
        icon: Handshake,
        collapsible: true,
        items: [
            { label: 'Deals', href: '/deals', icon: Handshake, ability: 'deals.view', match: (p) => p.startsWith('/deals') },
            { label: 'Deal Stages', href: '/deal-stages', icon: GitBranch, ability: 'deal_stages.manage', match: (p) => p.startsWith('/deal-stages') },
        ],
    },
];

function Rail({
    path,
    collapsed,
    onNavigate,
}: {
    path: string;
    collapsed: boolean;
    onNavigate?: () => void;
}) {
    const { can } = useAuth();
    const page = usePage<SharedProps>();
    const appName = page.props.app.name;
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ 'Lead Management': path.startsWith('/leads') || path.startsWith('/lead-'), 'Sales Pipeline': path.startsWith('/deals') || path.startsWith('/deal-stages') });

    const visible = groups
        .map((group) => ({ ...group, items: group.items.filter((item) => !item.ability || can(item.ability)) }))
        .filter((group) => group.items.length > 0);

    return (
        <div className="flex h-full flex-col border-r border-rail-line bg-rail">
            <div
                className={cn(
                    'flex h-16 shrink-0 items-center border-b border-rail-line',
                    collapsed ? 'justify-center px-2' : 'px-5',
                )}
            >
                <Link href="/users" aria-label={appName}>
                    {collapsed ? <WordmarkBadge name={appName} /> : <Wordmark name={appName} size="md" />}
                </Link>
            </div>

            <nav
                className={cn(
                    'flex-1 py-3',
                    collapsed ? 'space-y-2 overflow-y-visible px-2' : 'space-y-6 overflow-y-auto px-3',
                )}
            >
                {visible.map((group) => (
                    <div key={group.label}>
                        {(() => {
                            const groupActive = group.items.some((item) => item.match(path));
                            const expanded = !group.collapsible || (openGroups[group.label] ?? groupActive);
                            const GroupIcon = group.icon;
                            return <>
                                {!collapsed && (group.collapsible ? <button type="button" onClick={() => setOpenGroups((current) => ({ ...current, [group.label]: !expanded }))} className={cn('mb-1.5 flex w-full items-center gap-2 px-2.5 text-left text-xs font-semibold transition-colors', groupActive ? 'text-brand' : 'text-rail-ink-3')}>{GroupIcon && <GroupIcon className="size-4" />}<span className="flex-1">{group.label}</span><ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} /></button> : <p className="eyebrow mb-1.5 px-2.5 text-rail-ink-3">{group.label}</p>)}
                                {(expanded || collapsed) && <div className={cn('space-y-0.5', !collapsed && group.collapsible && 'ml-3.5 border-l border-line pl-2.5')}>{group.items.map((item) => {
                                const active = item.match(path);

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={onNavigate}
                                        aria-current={active ? 'page' : undefined}
                                        className={cn(
                                            'group relative flex items-center rounded-md text-xs font-medium transition-colors duration-150',
                                            collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5',
                                            active
                                                ? 'bg-brand-wash font-semibold text-brand'
                                                : 'text-rail-ink-2 hover:bg-rail-2 hover:text-rail-ink',
                                        )}
                                    >
                                        {active && !collapsed && (
                                            <span className="absolute inset-y-1.5 -left-2.5 w-0.5 rounded-r bg-brand" />
                                        )}
                                        <item.icon className="size-4 shrink-0" />
                                        {!collapsed && item.label}

                                        {collapsed && (
                                            <span
                                                role="tooltip"
                                                className="pointer-events-none absolute top-1/2 left-full z-60 ml-3 -translate-y-1/2 origin-left scale-90 rounded-md bg-brand px-2.5 py-1.5 text-2xs font-medium whitespace-nowrap text-brand-ink opacity-0 shadow-pop transition-all duration-150 group-hover:scale-100 group-hover:opacity-100"
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 rounded-[1px] bg-brand"
                                                />
                                                {item.label}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}</div>}
                            </>;
                        })()}
                    </div>
                ))}
            </nav>

        </div>
    );
}

export default function AppLayout({ children }: { children: ReactNode }) {
    const page = usePage<SharedProps>();
    const path = page.url.split('?')[0];

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    }, []);

    function toggleCollapsed() {
        setCollapsed((value) => {
            window.localStorage.setItem(STORAGE_KEY, value ? '0' : '1');

            return !value;
        });
    }

    const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

    return (
        <ToastProvider>
        <div className="app-canvas min-h-screen">
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-30 hidden transition-[width] duration-200 lg:block',
                    collapsed ? 'w-16' : 'w-64',
                )}
            >
                <Rail path={path} collapsed={collapsed} />
            </aside>

            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Close navigation"
                        onClick={() => setMobileOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
                    />
                    <aside className="absolute inset-y-0 left-0 w-60">
                        <Rail path={path} collapsed={false} onNavigate={() => setMobileOpen(false)} />
                        <button
                            type="button"
                            onClick={() => setMobileOpen(false)}
                            aria-label="Close navigation"
                            className="absolute top-4 right-3 text-ink-3 hover:text-ink"
                        >
                            <X className="size-4" />
                        </button>
                    </aside>
                </div>
            )}

            <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-16' : 'lg:pl-64')}>
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-brand-line/35 bg-surface/95 px-4 backdrop-blur-md sm:px-6">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open navigation"
                        className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink lg:hidden"
                    >
                        <PanelLeftOpen className="size-4" />
                    </button>

                    <button
                        type="button"
                        onClick={toggleCollapsed}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        aria-expanded={!collapsed}
                        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        className="hidden size-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink lg:flex"
                    >
                        <ToggleIcon className="size-4" />
                    </button>

                    <div className="relative hidden max-w-xs flex-1 sm:block">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                        <input
                            type="search"
                            disabled
                            placeholder="Global search coming next"
                            aria-label="Global search"
                            className="h-9 w-full cursor-not-allowed rounded-md border border-line bg-surface-2 pr-3 pl-8 text-xs text-ink placeholder:text-ink-3"
                        />
                    </div>

                    <div className="flex-1" />

                    <button
                        type="button"
                        aria-label="Notifications"
                        className="relative flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                        <Bell className="size-4" />
                    </button>

                    <button
                        type="button"
                        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                        onClick={toggleTheme}
                        className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-brand-wash hover:text-brand"
                    >
                        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
                    </button>

                    <span className="h-5 w-px bg-line" aria-hidden="true" />

                    <UserMenu />
                </header>

                <main className="px-4 pt-4 pb-[50px] sm:px-6 lg:px-6">
                    <div className="mx-auto max-w-[1600px]">
                        <Flash />
                        {children}
                    </div>
                </main>
            </div>
        </div>
        </ToastProvider>
    );
}
