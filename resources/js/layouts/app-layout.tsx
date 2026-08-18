import { Link, router, usePage } from '@inertiajs/react';
import {
    Bell,
    Check,
    CheckCheck,
    Boxes,
    CalendarClock,
    CalendarDays,
    ChartNoAxesCombined,
    FileUp,
    ChevronDown,
    ContactRound,
    CircleAlert,
    CreditCard,
    Globe2,
    Handshake,
    GitBranch,
    KeyRound,
    LifeBuoy,
    LayoutDashboard,
    ListChecks,
    PanelLeftClose,
    PanelLeftOpen,
    ReceiptText,
    Search,
    Sparkles,
    Moon,
    Sun,
    Tag,
    UserRoundSearch,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Flash } from '@/components/flash';
import { ToastProvider } from '@/components/toast';
import { UserMenu } from '@/components/user-menu';
import { Wordmark, WordmarkBadge } from '@/components/wordmark';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import type { Ability, SharedProps } from '@/types';
import { cn } from '@/lib/utils';
import { relativeTime } from '@/lib/format';

const STORAGE_KEY = 'crm.sidebar.collapsed';

type SearchResult = { type: string; icon: string; label: string; meta: string; href: string };
type HeaderNotification = { id: string; data: { title?: string; message?: string; tone?: string; url?: string | null }; read_at: string | null; created_at: string };

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
        label: 'Workspace',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, match: (p) => p === '/dashboard' },
            { label: 'My Work', href: '/my-work', icon: ListChecks, ability: 'tasks.view', match: (p) => p.startsWith('/my-work') },
            { label: 'Calendar', href: '/calendar', icon: CalendarDays, match: (p) => p.startsWith('/calendar') },
            { label: 'Tasks', href: '/tasks', icon: ListChecks, ability: 'tasks.view', match: (p) => p.startsWith('/tasks') },
        ],
    },
    {
        label: 'Customer Operations',
        items: [
            { label: 'Customers', href: '/customers', icon: ContactRound, ability: 'customers.view', match: (p) => p.startsWith('/customers') },
            { label: 'Instances', href: '/instances', icon: Boxes, ability: 'instances.view', match: (p) => p.startsWith('/instances') },
            { label: 'Follow-ups', href: '/follow-ups', icon: CalendarClock, ability: 'follow_ups.view', match: (p) => p.startsWith('/follow-ups') },
            { label: 'Support Tickets', href: '/support-tickets', icon: LifeBuoy, ability: 'support_tickets.view', match: (p) => p.startsWith('/support-tickets') },
        ],
    },
    {
        label: 'Lead Management',
        items: [
            { label: 'Leads', href: '/leads', icon: UserRoundSearch, ability: 'leads.view', match: (p) => p.startsWith('/leads') },
            { label: 'Lead Sources', href: '/lead-sources', icon: Globe2, ability: 'leads.manage', match: (p) => p.startsWith('/lead-sources') },
            { label: 'Lead Status', href: '/lead-statuses', icon: Tag, ability: 'leads.manage', match: (p) => p.startsWith('/lead-statuses') },
        ],
    },
    {
        label: 'Sales Pipeline',
        items: [
            { label: 'Deals', href: '/deals', icon: Handshake, ability: 'deals.view', match: (p) => p.startsWith('/deals') },
            { label: 'Deal Stages', href: '/deal-stages', icon: GitBranch, ability: 'deal_stages.manage', match: (p) => p.startsWith('/deal-stages') },
        ],
    },
    {
        label: 'Subscriptions & Billing',
        items: [
            { label: 'Subscriptions', href: '/subscriptions', icon: ReceiptText, ability: 'subscriptions.view', match: (p) => p.startsWith('/subscriptions') },
            { label: 'Payments', href: '/payments', icon: CreditCard, ability: 'payments.view', match: (p) => p.startsWith('/payments') },
        ],
    },
    {
        label: 'Catalog',
        items: [
            { label: 'Products', href: '/products', icon: Boxes, ability: 'products.view', match: (p) => p.startsWith('/products') || p.startsWith('/plans') },
        ],
    },
    {
        label: 'Analytics & Tools',
        items: [
            { label: 'Reports', href: '/reports', icon: ChartNoAxesCombined, ability: 'customers.view', match: (p) => p.startsWith('/reports') },
            { label: 'Import data', href: '/imports', icon: FileUp, ability: 'customers.view', match: (p) => p.startsWith('/imports') },
        ],
    },
    {
        label: 'Administration',
        items: [
            { label: 'Users', href: '/users', icon: Users, ability: 'users.view', match: (p) => p.startsWith('/users') },
            { label: 'Roles & Permissions', href: '/roles', icon: KeyRound, ability: 'roles.manage', match: (p) => p.startsWith('/roles') },
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
        .map((group) => ({
            ...group,
            items: group.items.filter((item) => !item.ability || can(item.ability)),
        }))
        .filter((group) => group.items.length > 0);

    const renderItems = (items: NavItem[]) => (
        <div className="space-y-0.5">
            {items.map((item) => {
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
                        {active && !collapsed && <span className="absolute inset-y-1.5 -left-2.5 w-0.5 rounded-r bg-brand" />}
                        <item.icon className="size-4 shrink-0" />
                        {!collapsed && item.label}
                        {collapsed && (
                            <span role="tooltip" className="pointer-events-none absolute top-1/2 left-full z-60 ml-3 -translate-y-1/2 origin-left scale-90 rounded-md bg-brand px-2.5 py-1.5 text-2xs font-medium whitespace-nowrap text-brand-ink opacity-0 shadow-pop transition-all duration-150 group-hover:scale-100 group-hover:opacity-100">
                                <span aria-hidden="true" className="absolute top-1/2 -left-1 size-2 -translate-y-1/2 rotate-45 rounded-[1px] bg-brand" />
                                {item.label}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );

    return (
        <div className="flex h-full flex-col border-r border-rail-line bg-rail">
            <div
                className={cn(
                    'flex h-16 shrink-0 items-center border-b border-rail-line',
                    collapsed ? 'justify-center px-2' : 'px-5',
                )}
            >
                <Link href="/dashboard" aria-label={appName}>
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
                                {(expanded || collapsed) && renderItems(group.items)}
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
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searching, setSearching] = useState(false);
    const searchRootRef = useRef<HTMLDivElement>(null);
    const [notificationOpen, setNotificationOpen] = useState(false);
    const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([]);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const notificationRootRef = useRef<HTMLDivElement>(null);
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    }, []);

    useEffect(() => {
        if (!searchOpen) return;
        const handlePointerDown = (event: PointerEvent) => {
            if (!searchRootRef.current?.contains(event.target as Node)) setSearchOpen(false);
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [searchOpen]);

    useEffect(() => {
        if (!notificationOpen) return;
        const handlePointerDown = (event: PointerEvent) => {
            if (!notificationRootRef.current?.contains(event.target as Node)) setNotificationOpen(false);
        };
        document.addEventListener('pointerdown', handlePointerDown);
        return () => document.removeEventListener('pointerdown', handlePointerDown);
    }, [notificationOpen]);

    useEffect(() => {
        if (!notificationOpen) return;
        setNotificationsLoading(true);
        fetch('/notifications/recent', { headers: { Accept: 'application/json' } })
            .then((response) => response.ok ? response.json() : { notifications: [] })
            .then((payload: { notifications?: HeaderNotification[] }) => setHeaderNotifications(payload.notifications ?? []))
            .catch(() => setHeaderNotifications([]))
            .finally(() => setNotificationsLoading(false));
    }, [notificationOpen]);

    useEffect(() => {
        const term = searchTerm.trim();
        if (term.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        const controller = new AbortController();
        const timer = window.setTimeout(() => {
            setSearching(true);
            fetch(`/search?q=${encodeURIComponent(term)}`, { headers: { Accept: 'application/json' }, signal: controller.signal })
                .then((response) => response.ok ? response.json() : { results: [] })
                .then((payload: { results?: SearchResult[] }) => setSearchResults(payload.results ?? []))
                .catch(() => { if (!controller.signal.aborted) setSearchResults([]); })
                .finally(() => { if (!controller.signal.aborted) setSearching(false); });
        }, 220);

        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [searchTerm]);

    const resultIcons: Record<string, LucideIcon> = { customer: ContactRound, lead: UserRoundSearch, deal: Handshake, product: Boxes, instance: Globe2, subscription: ReceiptText, ticket: LifeBuoy, task: ListChecks };
    const notificationIcon = (tone?: string) => tone === 'bad' ? CircleAlert : tone === 'ok' ? Check : tone === 'brand' ? Sparkles : Bell;
    const markNotificationRead = (notification: HeaderNotification) => {
        if (notification.read_at) return;
        setHeaderNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item));
        router.patch(`/notifications/${notification.id}/read`, {}, { preserveScroll: true });
    };

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

                    <div ref={searchRootRef} className="relative hidden max-w-md flex-1 sm:block">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) => { setSearchTerm(event.target.value); setSearchOpen(true); }}
                            onFocus={() => setSearchOpen(true)}
                            onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false); }}
                            placeholder="Search CRM"
                            aria-label="Global search"
                            className="h-9 w-full rounded-md border border-line bg-surface-2 pr-3 pl-8 text-xs text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand/50 focus:ring-2 focus:ring-brand/10"
                        />
                        {searchOpen && searchTerm.trim().length >= 2 && <div className="absolute top-11 left-0 z-50 w-[min(30rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-card">
                            {searching ? <div className="px-3.5 py-4 text-center text-xs text-ink-3">Searching…</div> : searchResults.length === 0 ? <div className="px-3.5 py-4 text-center text-xs text-ink-3">No matching records</div> : <ul className="max-h-80 overflow-y-auto py-1">{searchResults.map((result) => { const Icon = resultIcons[result.icon] ?? Search; return <li key={`${result.type}-${result.href}`}><Link href={result.href} onClick={() => { setSearchOpen(false); setSearchTerm(''); }} className="flex items-center gap-2.5 px-3 py-2 transition-colors hover:bg-surface-2"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-wash text-brand"><Icon className="size-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-medium text-ink">{result.label}</span><span className="block truncate text-2xs text-ink-3">{result.type} · {result.meta}</span></span></Link></li>; })}</ul>}
                        </div>}
                    </div>

                    <div className="flex-1" />

                    <div ref={notificationRootRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setNotificationOpen((value) => !value)}
                            aria-expanded={notificationOpen}
                            aria-label={`Notifications${page.props.notifications?.unread ? `, ${page.props.notifications.unread} unread` : ''}`}
                            className="relative flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-surface-3 hover:text-ink"
                        >
                            <Bell className="size-4" />
                            {Boolean(page.props.notifications?.unread) && <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-bad text-[8px] font-bold text-white ring-2 ring-surface">{page.props.notifications.unread > 9 ? '9+' : page.props.notifications.unread}</span>}
                        </button>
                        {notificationOpen && <div className="absolute top-11 right-0 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-card">
                            <div className="flex items-center justify-between border-b border-line bg-surface-2/40 px-3.5 py-2.5"><p className="text-xs font-semibold text-ink">Notifications</p>{Boolean(page.props.notifications?.unread) && <button type="button" className="inline-flex items-center gap-1 text-2xs font-medium text-brand hover:underline" onClick={() => { setHeaderNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() }))); router.patch('/notifications/read-all', {}, { preserveScroll: true }); }}><CheckCheck className="size-3.5" /> Mark all read</button>}</div>
                            {notificationsLoading ? <div className="px-3.5 py-7 text-center text-xs text-ink-3">Loading notifications…</div> : headerNotifications.length === 0 ? <div className="px-3.5 py-7 text-center text-xs text-ink-3">You’re all caught up</div> : <ul className="max-h-80 overflow-y-auto divide-y divide-line/70">{headerNotifications.map((notification) => { const Icon = notificationIcon(notification.data.tone); const content = <><span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${notification.read_at ? 'bg-surface-3 text-ink-3' : 'bg-brand-wash text-brand'}`}><Icon className="size-3.5" /></span><span className="min-w-0 flex-1"><span className={`block truncate text-xs ${notification.read_at ? 'font-medium text-ink-2' : 'font-semibold text-ink'}`}>{notification.data.title ?? 'Notification'}</span><span className="mt-0.5 block truncate text-2xs text-ink-3">{notification.data.message ?? 'A workflow update needs your attention.'}</span><span className="mt-1 block text-[10px] text-ink-3">{relativeTime(notification.created_at)}</span></span>{!notification.read_at && <span className="size-1.5 shrink-0 rounded-full bg-brand" />}</>; return <li key={notification.id}><Link href={notification.data.url ?? '/notifications'} onClick={() => { markNotificationRead(notification); setNotificationOpen(false); }} className="flex items-start gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-surface-2">{content}</Link></li>; })}</ul>}
                            <div className="border-t border-line px-3.5 py-2 text-center"><Link href="/notifications" onClick={() => setNotificationOpen(false)} className="text-2xs font-medium text-brand hover:underline">View all notifications</Link></div>
                        </div>}
                    </div>

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
