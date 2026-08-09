import { Head, router } from '@inertiajs/react';
import ReactECharts from 'echarts-for-react';
import { BarChart3, ContactRound, Download, Handshake, ReceiptText, Target } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SearchableSelect } from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';

interface Props {
    period: string;
    periodLabel: string;
    stats: { newCustomers: number | null; newLeads: number | null; wonDeals: number | null; paidRevenue: number | null };
    trend: { labels: string[]; customers: Array<number | null>; leads: Array<number | null>; revenue: Array<number | null> };
    pipeline: Array<{ label: string; value: number; color: string }>;
    can: { export: boolean };
}

const number = (value: number | null) => value === null ? '—' : value.toLocaleString('en-GB');
const currency = (value: number | null) => value === null ? '—' : `PKR ${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;

export default function ReportsIndex({ period, periodLabel, stats, trend, pipeline, can }: Props) {
    const pipelineOption = {
        animationDuration: 450,
        tooltip: { trigger: 'axis' },
        grid: { left: 32, right: 18, top: 18, bottom: 28 },
        xAxis: { type: 'category', data: pipeline.map((item) => item.label), axisTick: { show: false }, axisLine: { lineStyle: { color: '#d8dee8' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
        yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#e8edf3' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        series: [{ type: 'bar', barMaxWidth: 28, data: pipeline.map((item) => ({ value: item.value, itemStyle: { color: item.color || '#347cf6', borderRadius: [5, 5, 0, 0] } })) }],
    };
    const trendOption = {
        animationDuration: 450,
        tooltip: { trigger: 'axis' },
        legend: { top: 0, right: 0, itemWidth: 12, itemHeight: 6, textStyle: { color: '#64748b', fontSize: 10 } },
        grid: { left: 34, right: 20, top: 32, bottom: 22 },
        xAxis: { type: 'category', boundaryGap: false, data: trend.labels, axisTick: { show: false }, axisLine: { lineStyle: { color: '#d8dee8' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        yAxis: { type: 'value', minInterval: 1, splitLine: { lineStyle: { color: '#e8edf3' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        series: [
            { name: 'Customers', type: 'line', smooth: true, showSymbol: false, data: trend.customers, lineStyle: { color: '#347cf6', width: 2 }, areaStyle: { color: 'rgba(52,124,246,.08)' } },
            { name: 'Leads', type: 'line', smooth: true, showSymbol: false, data: trend.leads, lineStyle: { color: '#8b5cf6', width: 2 }, areaStyle: { color: 'rgba(139,92,246,.05)' } },
        ],
    };
    const hasTrend = trend.customers.some((value) => value !== null) || trend.leads.some((value) => value !== null);

    return <AppLayout><Head title="Reports" /><PageHeader title="Reports" description={`${periodLabel} · Operational performance overview`} actions={<div className="flex items-center gap-2"><SearchableSelect options={[{ value: '30d', label: 'Last 30 days' }, { value: '90d', label: 'Last 90 days' }, { value: '6m', label: 'Last 6 months' }, { value: '12m', label: 'Last 12 months' }]} value={period} onChange={(value) => router.get('/reports', { period: value }, { preserveState: true, replace: true })} />{can.export && <a href={`/reports/export?period=${period}`} download className={buttonVariants({ variant: 'secondary', size: 'sm' })}><Download className="size-3.5" /> Export CSV</a>}</div>} /><div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="New customers" value={number(stats.newCustomers)} icon={ContactRound} tone="brand" variant="featured" href="/customers" caption="Created in period" /><StatCard label="New leads" value={number(stats.newLeads)} icon={Target} tone="info" variant="featured" href="/leads" caption="Added to pipeline" /><StatCard label="Won deals" value={number(stats.wonDeals)} icon={Handshake} tone="ok" variant="featured" href="/deals" caption="Closed successfully" /><StatCard label="Paid revenue" value={currency(stats.paidRevenue)} icon={ReceiptText} tone="alt" variant="featured" href="/payments?status=paid" caption="Recorded payments" /></div><div className="grid gap-4 xl:grid-cols-3"><Card className="xl:col-span-2"><CardHeader title="Acquisition trend" meta={periodLabel} /><CardBody className="pb-2">{hasTrend ? <ReactECharts option={trendOption} opts={{ renderer: 'svg' }} style={{ height: 250 }} /> : <div className="flex h-[250px] items-center justify-center text-xs text-ink-3">No trend data available for this period.</div>}</CardBody></Card><Card><CardHeader title="Lead pipeline" /><CardBody className="pb-2">{pipeline.length ? <ReactECharts option={pipelineOption} opts={{ renderer: 'svg' }} style={{ height: 250 }} /> : <div className="flex h-[250px] items-center justify-center text-xs text-ink-3">No pipeline data available.</div>}</CardBody></Card></div><Card className="mt-4"><CardHeader title="Report notes" /><CardBody className="flex items-start gap-3"><BarChart3 className="mt-0.5 size-4 shrink-0 text-brand" /><p className="text-xs leading-relaxed text-ink-2">Metrics respect your permissions and use the selected date range. Paid revenue is calculated from recorded payments marked as paid; it does not include pending invoices or external gateway settlements.</p></CardBody></Card></AppLayout>;
}
