import { Head, Link } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';
import {
    Activity,
    AlertCircle,
    CalendarClock,
    CheckSquare,
    ContactRound,
    CreditCard,
    History,
    LifeBuoy,
    ListChecks,
    Plus,
    ReceiptText,
    Target,
    Ticket,
    Users,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatCard, type StatTone } from '@/components/stat-card';
import { Avatar } from '@/components/ui/avatar';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { useAuth } from '@/hooks/use-auth';
import type { Activity as ActivityRow } from '@/types';
import { relativeTime, shortDate, toneForEvent } from '@/lib/format';

interface StatMap {
    customers: number | null;
    leads: number | null;
    trials: number | null;
    subscriptions: number | null;
    expiring: number | null;
    grace: number | null;
    overduePayments: number | null;
    openTickets: number | null;
    overdueTasks: number | null;
    followUpsToday: number | null;
    overdueFollowUps: number | null;
    products: number | null;
    plans: number | null;
    users: number | null;
}

interface Props {
    stats: StatMap;
    pipeline: Array<{ label: string; value: number; color: string }>;
    subscriptionMix: Array<{ label: string; value: number }>;
    trend: { labels: string[]; customers: Array<number | null>; payments: Array<number | null> };
    actionItems: Array<{
        id: string;
        type: string;
        title: string;
        detail: string;
        due_at: string | null;
        href: string;
        tone: BadgeTone;
    }>;
    recentActivity: ActivityRow[];
}

const kpis: Array<{ key: keyof StatMap; label: string; icon: typeof Users; tone: StatTone; href: string; caption: string }> = [
    { key: 'customers', label: 'Active customers', icon: ContactRound, tone: 'brand', href: '/customers', caption: 'Accounts in good standing' },
    { key: 'leads', label: 'Open leads', icon: Target, tone: 'info', href: '/leads', caption: 'In the sales pipeline' },
    { key: 'subscriptions', label: 'Active subscriptions', icon: ReceiptText, tone: 'ok', href: '/subscriptions', caption: 'Live customer access' },
    { key: 'trials', label: 'Trials in progress', icon: CalendarClock, tone: 'alt', href: '/subscriptions?kind=trial', caption: 'Still evaluating' },
    { key: 'overduePayments', label: 'Overdue payments', icon: CreditCard, tone: 'bad', href: '/payments?status=pending', caption: 'Needs collection' },
    { key: 'openTickets', label: 'Open tickets', icon: LifeBuoy, tone: 'warn', href: '/support-tickets', caption: 'Waiting for resolution' },
    { key: 'overdueTasks', label: 'Overdue tasks', icon: CheckSquare, tone: 'bad', href: '/tasks', caption: 'Past their due date' },
    { key: 'followUpsToday', label: 'Follow-ups today', icon: ListChecks, tone: 'brand', href: '/follow-ups', caption: 'Scheduled for today' },
];

const typeIcon: Record<string, typeof CheckSquare> = {
    Task: CheckSquare,
    'Follow-up': CalendarClock,
    Payment: CreditCard,
    Ticket: Ticket,
};

export default function Dashboard({ stats, pipeline, subscriptionMix, trend, actionItems, recentActivity }: Props) {
    const { can } = useAuth();
    const visibleKpis = kpis.filter((kpi) => stats[kpi.key] !== null);
    const pipelineValues = pipeline.map((item) => item.value);
    const subscriptionValues = subscriptionMix.map((item) => item.value);

    const pipelineOption = {
        animationDuration: 450,
        tooltip: { trigger: 'axis' },
        grid: { left: 30, right: 18, top: 18, bottom: 28 },
        xAxis: { type: 'category', data: pipeline.map((item) => item.label), axisTick: { show: false }, axisLine: { lineStyle: { color: '#d8dee8' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
        yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#e8edf3' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        series: [{ type: 'bar', barMaxWidth: 28, data: pipeline.map((item) => ({ value: item.value, itemStyle: { color: item.color || '#347cf6', borderRadius: [5, 5, 0, 0] } })) }],
    };

    const subscriptionOption = {
        animationDuration: 450,
        tooltip: { trigger: 'item' },
        legend: { bottom: 0, left: 'center', itemWidth: 8, itemHeight: 8, textStyle: { color: '#64748b', fontSize: 10 } },
        series: [{ type: 'pie', radius: ['48%', '72%'], center: ['50%', '45%'], avoidLabelOverlap: true, label: { show: false }, data: subscriptionMix.map((item, index) => ({ value: item.value, name: item.label, itemStyle: { color: ['#347cf6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#94a3b8'][index % 6] } })) }],
    };

    const trendOption = {
        animationDuration: 450,
        tooltip: { trigger: 'axis' },
        legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 6, textStyle: { color: '#64748b', fontSize: 10 } },
        grid: { left: 30, right: 16, top: 30, bottom: 22 },
        xAxis: { type: 'category', boundaryGap: false, data: trend.labels, axisTick: { show: false }, axisLine: { lineStyle: { color: '#d8dee8' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#e8edf3' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        series: [
            { name: 'Customers', type: 'line', smooth: true, showSymbol: false, data: trend.customers, lineStyle: { color: '#347cf6', width: 2 }, areaStyle: { color: 'rgba(52,124,246,.08)' } },
            { name: 'Payments', type: 'line', smooth: true, showSymbol: false, data: trend.payments, lineStyle: { color: '#10b981', width: 2 }, areaStyle: { color: 'rgba(16,185,129,.05)' } },
        ],
    };

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <PageHeader
                title="Dashboard"
                description="A focused view of your customer operations and today's priorities."
                actions={
                    <>
                        {can('tasks.create') && <Link href="/tasks/create" className={buttonVariants({ variant: 'secondary', size: 'sm' })}><Plus className="size-3.5" /> New task</Link>}
                        {can('follow_ups.create') && <Link href="/follow-ups/create" className={buttonVariants({ variant: 'primary', size: 'sm' })}><Plus className="size-3.5" /> Follow-up</Link>}
                    </>
                }
            />

            {visibleKpis.length > 0 && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleKpis.map((kpi) => (
                        <StatCard key={kpi.key} label={kpi.label} value={stats[kpi.key] ?? 0} icon={kpi.icon} tone={kpi.tone} caption={kpi.caption} href={kpi.href} variant="featured" />
                    ))}
                </div>
            )}

            <div className="mb-4 grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader title="Activity trend" meta="Last 6 months" />
                    <CardBody className="pb-2">
                        {trend.labels.length > 0 && (trend.customers.some((value) => value !== null) || trend.payments.some((value) => value !== null)) ? <ReactECharts option={trendOption} opts={{ renderer: 'svg' }} style={{ height: 210 }} /> : <EmptyState icon={Activity} title="No trend data yet" />}
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader title="Subscription health" />
                    <CardBody className="pb-2">
                        {subscriptionValues.length > 0 ? <ReactECharts option={subscriptionOption} opts={{ renderer: 'svg' }} style={{ height: 210 }} /> : <EmptyState icon={ReceiptText} title="No subscription data yet" />}
                    </CardBody>
                </Card>
            </div>

            <div className="mb-4 grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader title="Lead pipeline" action={<Link href="/leads" className="text-2xs font-medium text-brand hover:underline">Open pipeline</Link>} />
                    <CardBody className="pb-2">
                        {pipelineValues.length > 0 ? <ReactECharts option={pipelineOption} opts={{ renderer: 'svg' }} style={{ height: 210 }} /> : <EmptyState icon={Target} title="No lead pipeline data" />}
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader title="Action required" action={<Badge tone={actionItems.length ? 'bad' : 'ok'} size="sm">{actionItems.length} open</Badge>} />
                    {actionItems.length === 0 ? <CardBody><EmptyState icon={CheckSquare} title="You're all caught up" /></CardBody> : <ul className="divide-y divide-line/70">{actionItems.map((item) => { const Icon = typeIcon[item.type] ?? AlertCircle; return <li key={item.id} className="flex items-center gap-2.5 px-3.5 py-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-3 text-ink-3"><Icon className="size-3.5" /></span><div className="min-w-0 flex-1"><Link href={item.href} className="block truncate text-xs font-medium text-ink hover:text-brand">{item.title}</Link><p className="truncate text-2xs text-ink-3">{item.detail}</p></div><div className="shrink-0 text-right"><Badge tone={item.tone} size="sm">{item.type}</Badge><p className="mt-0.5 text-[10px] text-ink-3">{item.due_at ? shortDate(item.due_at) : 'Due'}</p></div></li>; })}</ul>}
                </Card>
            </div>

            <Card>
                <CardHeader title="Recent activity" action={<Link href="/activity" className="text-2xs font-medium text-brand hover:underline">View all</Link>} />
                {recentActivity.length === 0 ? <CardBody><EmptyState icon={History} title="No activity yet" /></CardBody> : <ul className="divide-y divide-line/70">{recentActivity.map((activity) => <li key={activity.id} className="flex items-center gap-2.5 px-3.5 py-2"><Avatar name={activity.user?.name ?? 'System'} src={activity.user?.avatar_url} size="xs" /><p className="min-w-0 flex-1 truncate text-xs text-ink">{activity.description ?? activity.event}</p><span className="hidden truncate text-2xs text-ink-3 sm:block">{activity.user?.name ?? 'System'}</span><Badge tone={toneForEvent(activity.event)} size="sm">{activity.event.split('.').pop()}</Badge><time suppressHydrationWarning dateTime={activity.created_at} className="num w-9 shrink-0 text-right text-2xs text-ink-3">{relativeTime(activity.created_at)}</time></li>)}</ul>}
            </Card>
        </AppLayout>
    );
}
