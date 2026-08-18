import { Head, Link, router } from '@inertiajs/react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
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
    trend: { labels: string[]; customers: Array<number | null>; leads: Array<number | null>; payments: Array<number | null> };
    period: number;
    paymentSummary: { collected: number | null; outstanding: number | null; partiallyPaid: number | null };
    workload: Array<{ label: string; tasks: number; followUps: number; tickets: number }>;
    renewals: Array<{ id: number; name: string; status: string; renewal_at: string | null }>;
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

export default function Dashboard({ stats, pipeline, subscriptionMix, trend, period, paymentSummary, workload, renewals, actionItems, recentActivity }: Props) {
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
            { name: 'Leads', type: 'line', smooth: true, showSymbol: false, data: trend.leads, lineStyle: { color: '#8b5cf6', width: 2 }, areaStyle: { color: 'rgba(139,92,246,.04)' } },
            { name: 'Payments', type: 'line', smooth: true, showSymbol: false, data: trend.payments, lineStyle: { color: '#10b981', width: 2 }, areaStyle: { color: 'rgba(16,185,129,.05)' } },
        ],
    };

    const workloadOption = {
        animationDuration: 450,
        tooltip: { trigger: 'axis' },
        legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 6, textStyle: { color: '#64748b', fontSize: 10 } },
        grid: { left: 34, right: 12, top: 30, bottom: 38 },
        xAxis: { type: 'category', data: workload.map((owner) => owner.label), axisTick: { show: false }, axisLabel: { color: '#64748b', fontSize: 10, rotate: workload.length > 4 ? 18 : 0 } },
        yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#e8edf3' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        series: [
            { name: 'Tasks', type: 'bar', barMaxWidth: 14, data: workload.map((owner) => owner.tasks), itemStyle: { color: '#347cf6', borderRadius: [4, 4, 0, 0] } },
            { name: 'Follow-ups', type: 'bar', barMaxWidth: 14, data: workload.map((owner) => owner.followUps), itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] } },
            { name: 'Tickets', type: 'bar', barMaxWidth: 14, data: workload.map((owner) => owner.tickets), itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] } },
        ],
    };

    const money = (value: number | null) => value === null ? '—' : new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(value);
    const periodLabel = period === 30 ? 'Last 30 days' : period === 90 ? 'Last 90 days' : 'Last 6 months';

    return (
        <AppLayout>
            <Head title="Dashboard" />

            <PageHeader
                title="Dashboard"
                description=""
                actions={
                    <>
                        {can('tasks.create') && <Link href="/tasks/create" className={buttonVariants({ variant: 'secondary', size: 'sm' })}><Plus className="size-3.5" /> New task</Link>}
                        {can('follow_ups.create') && <Link href="/follow-ups/create" className={buttonVariants({ variant: 'primary', size: 'sm' })}><Plus className="size-3.5" /> Follow-up</Link>}
                    </>
                }
            />

            <Card className="mb-4">
                <CardBody className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div>
                        <p className="text-xs font-medium text-ink">Operations overview</p>
                        <p className="text-2xs text-ink-3">Adjust the reporting window for trends and activity.</p>
                    </div>
                    <div className="w-40">
                        <SearchableSelect
                            options={[{ value: '30', label: 'Last 30 days' }, { value: '90', label: 'Last 90 days' }, { value: '180', label: 'Last 6 months' }]}
                            value={String(period)}
                            onChange={(value) => router.get('/dashboard', { period: value }, { preserveState: true, preserveScroll: true })}
                            placeholder="Reporting window"
                            searchPlaceholder="Search windows..."
                        />
                    </div>
                </CardBody>
            </Card>

            {visibleKpis.length > 0 && (
                <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {visibleKpis.map((kpi) => (
                        <StatCard key={kpi.key} label={kpi.label} value={stats[kpi.key] ?? 0} icon={kpi.icon} tone={kpi.tone} caption={kpi.caption} href={kpi.href} variant="featured" />
                    ))}
                </div>
            )}

            <div className="mb-4 grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-2">
                    <CardHeader title="Activity trend" meta={periodLabel} />
                    <CardBody className="pb-2">
                        {trend.labels.length > 0 && (trend.customers.some((value) => value !== null) || trend.leads.some((value) => value !== null) || trend.payments.some((value) => value !== null)) ? <ReactECharts option={trendOption} opts={{ renderer: 'svg' }} style={{ height: 210 }} /> : <EmptyState icon={Activity} title="No trend data yet" />}
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
                    <CardHeader title="Owner workload" meta="Open work by owner" />
                    <CardBody className="pb-2">
                        {workload.length > 0 ? <ReactECharts option={workloadOption} opts={{ renderer: 'svg' }} style={{ height: 220 }} /> : <EmptyState icon={Users} title="No workload data" />}
                    </CardBody>
                </Card>
                <Card>
                    <CardHeader title="Collections" meta="All time" />
                    <CardBody className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-1">
                        <div className="rounded-md bg-ok-wash/50 px-3 py-2"><p className="text-2xs text-ink-3">Collected</p><p className="num mt-0.5 text-sm font-semibold text-ok">{money(paymentSummary.collected)}</p></div>
                        <div className="rounded-md bg-warn-wash/50 px-3 py-2"><p className="text-2xs text-ink-3">Outstanding</p><p className="num mt-0.5 text-sm font-semibold text-warn">{money(paymentSummary.outstanding)}</p></div>
                        <div className="rounded-md bg-info-wash/50 px-3 py-2"><p className="text-2xs text-ink-3">Partially paid</p><p className="num mt-0.5 text-sm font-semibold text-info">{money(paymentSummary.partiallyPaid)}</p></div>
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

            <Card className="mb-4">
                <CardHeader title="Renewals due soon" meta="Next 30 days" action={<Link href="/subscriptions" className="text-2xs font-medium text-brand hover:underline">View subscriptions</Link>} />
                {renewals.length === 0 ? <CardBody><EmptyState icon={CalendarClock} title="No renewals due soon" /></CardBody> : <ul className="grid divide-y divide-line/70 sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-3">{renewals.map((renewal) => <li key={renewal.id} className="flex items-center gap-2.5 px-3.5 py-2.5"><span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-alt-wash text-alt"><CalendarClock className="size-3.5" /></span><div className="min-w-0 flex-1"><Link href={`/subscriptions/${renewal.id}`} className="block truncate text-xs font-medium text-ink hover:text-brand">{renewal.name}</Link><p className="text-2xs text-ink-3">{renewal.renewal_at ? shortDate(renewal.renewal_at) : 'Date not set'}</p></div><Badge tone={renewal.status === 'past_due' ? 'bad' : renewal.status === 'trialing' ? 'info' : 'ok'} size="sm">{renewal.status.replace('_', ' ')}</Badge></li>)}</ul>}
            </Card>

            <Card>
                <CardHeader title="Recent activity" action={<Link href="/activity" className="text-2xs font-medium text-brand hover:underline">View all</Link>} />
                {recentActivity.length === 0 ? <CardBody><EmptyState icon={History} title="No activity yet" /></CardBody> : <ul className="divide-y divide-line/70">{recentActivity.map((activity) => <li key={activity.id} className="flex items-center gap-2.5 px-3.5 py-2"><Avatar name={activity.user?.name ?? 'System'} src={activity.user?.avatar_url} size="xs" /><p className="min-w-0 flex-1 truncate text-xs text-ink">{activity.description ?? activity.event}</p><span className="hidden truncate text-2xs text-ink-3 sm:block">{activity.user?.name ?? 'System'}</span><Badge tone={toneForEvent(activity.event)} size="sm">{activity.event.split('.').pop()}</Badge><time suppressHydrationWarning dateTime={activity.created_at} className="num w-9 shrink-0 text-right text-2xs text-ink-3">{relativeTime(activity.created_at)}</time></li>)}</ul>}
            </Card>
        </AppLayout>
    );
}
