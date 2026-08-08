import { Head, Link } from '@inertiajs/react';
import { Boxes, History, Layers, ShieldCheck, Users } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatCard, type StatTone } from '@/components/stat-card';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Activity as ActivityRow } from '@/types';
import { relativeTime, toneForEvent } from '@/lib/format';

interface Props {
    stats: {
        products: number | null;
        plans: number | null;
        users: number | null;
    };
    recentActivity: ActivityRow[];
}

const tiles: Array<{
    key: 'products' | 'plans' | 'users';
    label: string;
    icon: typeof Boxes;
    tone: StatTone;
    href: string;
    caption: string;
}> = [
    { key: 'products', label: 'Active products', icon: Boxes, tone: 'brand', href: '/products', caption: 'In catalogue' },
    { key: 'plans', label: 'Active plans', icon: Layers, tone: 'info', href: '/products', caption: 'Sellable terms' },
    { key: 'users', label: 'Active users', icon: Users, tone: 'ok', href: '/users', caption: 'With system access' },
];

export default function Dashboard({ stats, recentActivity }: Props) {
    const visible = tiles.filter((tile) => stats[tile.key] !== null);

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <PageHeader
                title="Dashboard"
                badge={
                    <Badge tone="neutral" size="sm">
                        Phase 1
                    </Badge>
                }
            />

            {visible.length > 0 && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {visible.map((tile) => (
                        <StatCard
                            key={tile.key}
                            label={tile.label}
                            value={stats[tile.key] ?? 0}
                            icon={tile.icon}
                            tone={tile.tone}
                            caption={tile.caption}
                            href={tile.href}
                        />
                    ))}
                    <StatCard
                        label="Audited events"
                        value={recentActivity.length > 0 ? `${recentActivity.length}+` : 0}
                        icon={ShieldCheck}
                        tone="alt"
                        caption="Recorded changes"
                        href="/activity"
                    />
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader
                        title="Recent activity"
                        action={
                            <Link href="/activity" className="text-2xs font-medium text-brand hover:underline">
                                View all
                            </Link>
                        }
                    />
                    {recentActivity.length === 0 ? (
                        <CardBody>
                            <EmptyState icon={History} title="No activity yet" />
                        </CardBody>
                    ) : (
                        <ul className="divide-y divide-line/70">
                            {recentActivity.map((activity) => (
                                <li key={activity.id} className="flex items-center gap-2.5 px-3.5 py-1.5">
                                    <Avatar name={activity.user?.name ?? 'System'} src={activity.user?.avatar_url} size="xs" />
                                    <p className="min-w-0 flex-1 truncate text-xs text-ink">
                                        {activity.description ?? activity.event}
                                    </p>
                                    <span className="hidden truncate text-2xs text-ink-3 sm:block">
                                        {activity.user?.name ?? 'System'}
                                    </span>
                                    <Badge tone={toneForEvent(activity.event)} size="sm">
                                        {activity.event.split('.').pop()}
                                    </Badge>
                                    <time
                                        suppressHydrationWarning
                                        dateTime={activity.created_at}
                                        className="num w-9 shrink-0 text-right text-2xs text-ink-3"
                                    >
                                        {relativeTime(activity.created_at)}
                                    </time>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>

                <Card className="h-fit">
                    <CardHeader title="Delivery phases" meta="§23" />
                    <ul className="divide-y divide-line/70">
                        {[
                            ['Foundation', 'Auth, roles, products, audit', true],
                            ['Leads & customers', 'Profiles, follow-ups, conversion', false],
                            ['Instances & subscriptions', 'Trials, lifecycle, renewals', false],
                            ['Tasks & notifications', 'Routing, automation rules', false],
                            ['Payments & support', 'Dues, tickets, workflow', false],
                            ['Dashboard & reports', 'KPIs, charts, drill-down', false],
                            ['Migration & hardening', 'Excel import, cutover', false],
                        ].map(([name, detail, done], index) => (
                            <li key={name as string} className="flex items-center gap-2.5 px-3.5 py-2">
                                <span
                                    className={
                                        done
                                            ? 'num flex size-5 shrink-0 items-center justify-center rounded-full bg-ok-wash text-[9px] font-bold text-ok'
                                            : 'num flex size-5 shrink-0 items-center justify-center rounded-full bg-surface-3 text-[9px] font-bold text-ink-3'
                                    }
                                >
                                    {index + 1}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className={done ? 'truncate text-xs font-medium text-ink' : 'truncate text-xs text-ink-2'}>
                                        {name}
                                    </p>
                                    <p className="truncate text-2xs text-ink-3">{detail}</p>
                                </div>
                                {done && (
                                    <Badge tone="ok" size="sm">
                                        Done
                                    </Badge>
                                )}
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>

            {visible.length === 0 && recentActivity.length === 0 && (
                <Card>
                    <CardBody>
                        <EmptyState
                            icon={History}
                            title="Nothing available for your role"
                            description="Ask a Super Admin to review your permissions."
                        />
                    </CardBody>
                </Card>
            )}
        </AppLayout>
    );
}
