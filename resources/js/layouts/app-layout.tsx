import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    PanelLeftClose,
    PanelLeftOpen,
    Search,
    Users,
    X,
    type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { Flash } from '@/components/flash';
import { UserMenu } from '@/components/user-menu';
import { Wordmark, WordmarkBadge } from '@/components/wordmark';
import { useAuth } from '@/hooks/use-auth';
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
}

const groups: NavGroup[] = [
    {
        label: 'Administration',
        items: [
            { label: 'Users', href: '/users', icon: Users, ability: 'users.view', match: (p) => p.startsWith('/users') },
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
                        {!collapsed && <p className="eyebrow mb-1.5 px-2.5 text-rail-ink-3">{group.label}</p>}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
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
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {!collapsed && (
                <div className="shrink-0 border-t border-rail-line px-4 py-2.5">
                    <p className="text-2xs text-rail-ink-3">Phase 1 · Foundation</p>
                </div>
            )}
        </div>
    );
}

export default function AppLayout({ children }: { children: ReactNode }) {
    const page = usePage<SharedProps>();
    const path = page.url.split('?')[0];

    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="min-h-screen bg-canvas">
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
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur-md sm:px-6">
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
    );
}
