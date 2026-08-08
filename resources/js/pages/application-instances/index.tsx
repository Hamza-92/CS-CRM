import { Head, Link } from '@inertiajs/react';
import { Archive, ArrowUpRight, Box, CheckCircle2, Clock3, LayoutGrid, List, PauseCircle, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { StatCard } from '@/components/stat-card';
import { useAuth } from '@/hooks/use-auth';
import { useFilters } from '@/hooks/use-filters';
import { usePersistedState } from '@/hooks/use-persisted-state';
import AppLayout from '@/layouts/app-layout';
import type { ApplicationInstance, Paginated, ProductRef } from '@/types';

type Ref = { id: number; name: string; business?: string | null; email?: string | null };
const tone: Record<string, 'ok' | 'warn' | 'bad' | 'neutral'> = { active: 'ok', planned: 'warn', paused: 'bad', retired: 'neutral' };

function InstanceCard({ instance }: { instance: ApplicationInstance }) {
    const accent = instance.product?.brand_color || '#3b82f6';
    return <Link href={`/instances/${instance.id}`} className="group block"><Card className="h-full border-l-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ borderLeftColor: accent }}><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand"><Box className="size-5" /></div><div className="min-w-0"><div className="truncate font-semibold text-ink">{instance.name}</div><div className="truncate text-sm text-ink-3">{instance.customer?.business || instance.customer?.name}</div></div></div><Badge tone={tone[instance.status] ?? 'neutral'} size="sm">{instance.status_label ?? instance.status}</Badge></div><div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-sm"><span className="text-ink-2">{instance.product?.name} · {instance.environment_label ?? instance.environment}</span><ArrowUpRight className="size-4 text-ink-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div></Card></Link>;
}

export default function ApplicationInstancesIndex({ instances, filters, stats, options }: { instances: Paginated<ApplicationInstance>; filters: Record<string, string | number | null>; stats: Record<string, number>; options: { customers: Ref[]; products: ProductRef[] } }) {
    const { can } = useAuth();
    const { values, set, setMany } = useFilters('/instances', filters);
    const [view, setView] = usePersistedState<'list' | 'grid'>('crm.instances.view', 'list');
    const canCreate = can('instances.create') || can('instances.manage');
    const clear = () => setMany({ search: '', status: '', environment: '', customer_id: '', product_id: '' });
    const statusOptions = [{ value: '', label: 'All statuses' }, ...Object.keys(stats).map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))];
    const envOptions = [{ value: '', label: 'All environments' }, ...['demo', 'staging', 'production', 'sandbox'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))];
    return <AppLayout><Head title="Instances" /><PageHeader title="Instances" badge={<Badge tone="neutral" size="sm">{instances.total}</Badge>} actions={<div className="flex gap-2"><Link href="/instances/archived"><Button variant="secondary"><Archive /> Archived</Button></Link>{canCreate && <Link href="/instances/create"><Button><Plus /> New instance</Button></Link>}</div>} />
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Active" value={stats.active ?? 0} icon={CheckCircle2} tone="ok" variant="featured" href="/instances?status=active" caption="Live deployments" />
            <StatCard label="Planned" value={stats.planned ?? 0} icon={Clock3} tone="brand" variant="featured" href="/instances?status=planned" caption="Queued deployments" />
            <StatCard label="Paused" value={stats.paused ?? 0} icon={PauseCircle} tone="warn" variant="featured" href="/instances?status=paused" caption="Needs attention" />
            <StatCard label="Retired" value={stats.retired ?? 0} icon={Box} tone="alt" variant="featured" href="/instances?status=retired" caption="No longer active" />
        </div>
        <Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder="Search instances" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="w-36"><SearchableSelect options={statusOptions} value={String(values.status ?? '')} onChange={(value) => set('status', value)} /></div><div className="w-40"><SearchableSelect options={envOptions} value={String(values.environment ?? '')} onChange={(value) => set('environment', value)} /></div><div className="w-44"><SearchableSelect options={[{ value: '', label: 'All customers' }, ...options.customers.map((item) => ({ value: String(item.id), label: item.name }))]} value={String(values.customer_id ?? '')} onChange={(value) => set('customer_id', value)} /></div>{(values.search || values.status || values.environment || values.customer_id) && <button onClick={clear} className="text-xs font-medium text-brand hover:underline">Clear filters</button>}<div className="ml-auto flex rounded-md border border-line bg-surface p-0.5"><button aria-label="List view" onClick={() => setView('list')} className={`rounded px-2 py-1 ${view === 'list' ? 'bg-brand text-brand-ink' : 'text-ink-3'}`}><List className="size-4" /></button><button aria-label="Grid view" onClick={() => setView('grid')} className={`rounded px-2 py-1 ${view === 'grid' ? 'bg-brand text-brand-ink' : 'text-ink-3'}`}><LayoutGrid className="size-4" /></button></div></div></Card>
        {view === 'grid' ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{instances.data.map((instance) => <InstanceCard key={instance.id} instance={instance} />)}</div> : <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wider text-ink-3"><tr><th className="px-4 py-3">Instance</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Environment</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-line">{instances.data.map((instance) => <tr key={instance.id} className="transition-colors hover:bg-surface-2"><td className="px-4 py-3"><Link className="font-semibold text-ink hover:text-brand" href={`/instances/${instance.id}`}>{instance.name}</Link><div className="text-xs text-ink-3">{instance.version || 'No version set'}</div></td><td className="px-4 py-3 text-ink-2">{instance.customer?.business || instance.customer?.name}</td><td className="px-4 py-3 text-ink-2">{instance.product?.name}</td><td className="px-4 py-3 capitalize text-ink-2">{instance.environment_label ?? instance.environment}</td><td className="px-4 py-3"><Badge tone={tone[instance.status] ?? 'neutral'} size="sm">{instance.status_label ?? instance.status}</Badge></td><td className="px-4 py-3 text-right"><Link href={`/instances/${instance.id}`} className="text-ink-3 hover:text-brand"><ArrowUpRight className="ml-auto size-4" /></Link></td></tr>)}</tbody></table></div><Pagination meta={instances} perPage={Number(values.per_page ?? 12)} onPerPageChange={(value) => set('per_page', value)} /></Card>}
    </AppLayout>;
}
