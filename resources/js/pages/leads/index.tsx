import { Head, Link } from '@inertiajs/react';
import { Archive, Columns3, Download, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { LeadBoard, type LeadBoardColumn } from '@/components/leads/lead-board';
import { LeadsGrid, LeadsTable } from '@/components/leads/leads-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useFilters } from '@/hooks/use-filters';
import { usePersistedState } from '@/hooks/use-persisted-state';
import AppLayout from '@/layouts/app-layout';
import type { Lead, Paginated, UserRef } from '@/types';
import { cn } from '@/lib/utils';

interface FilterOption { value: string; label: string; color?: string; status?: string }
interface Props {
    leads: Paginated<Lead>;
    owners: UserRef[];
    statuses: FilterOption[];
    sources: FilterOption[];
    kanban: LeadBoardColumn[];
    filters: { search: string; status: string; source: string; owner_id: string; sort: string; direction: 'asc' | 'desc'; per_page: number };
    can: { create: boolean; update: boolean; archive: boolean; convert: boolean };
}

export default function LeadsIndex({ leads, owners, statuses, sources, kanban, filters, can }: Props) {
    const { values, set, setMany } = useFilters('/leads', filters);
    const [view, setView] = usePersistedState<'list' | 'grid' | 'kanban'>('crm.leads.view', 'kanban');
    const hasFilters = Boolean(values.search || values.status || values.source || values.owner_id);
    const ownerOptions = [{ value: '', label: 'All owners' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name }))];
    const statusOptions = [{ value: '', label: 'All statuses' }, ...statuses];
    const sourceOptions = [{ value: '', label: 'All sources' }, ...sources];

    return <AppLayout>
        <Head title="Leads" />
        <PageHeader title="Leads" badge={<Badge tone="neutral" size="sm">{leads.total}</Badge>} actions={<div className="flex items-center gap-2"><Link href="/leads/export"><Button variant="secondary"><Download /> Export</Button></Link><Link href="/leads/archived"><Button variant="secondary"><Archive /> Archived</Button></Link>{can.create && <Link href="/leads/create"><Button><Plus /> New lead</Button></Link>}</div>} />
        <Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder="Search leads" aria-label="Search leads" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="w-40"><SearchableSelect options={statusOptions} value={values.status ?? ''} onChange={(value) => set('status', value)} placeholder="All statuses" searchPlaceholder="Search statuses..." /></div><div className="w-40"><SearchableSelect options={sourceOptions} value={values.source ?? ''} onChange={(value) => set('source', value)} placeholder="All sources" searchPlaceholder="Search sources..." /></div><div className="w-40"><SearchableSelect options={ownerOptions} value={values.owner_id ?? ''} onChange={(value) => set('owner_id', value)} placeholder="All owners" searchPlaceholder="Search owners..." /></div>{hasFilters && <button type="button" onClick={() => setMany({ search: '', status: '', source: '', owner_id: '' })} className="text-xs font-medium text-brand hover:underline">Clear filters</button>}<div className="ml-auto flex rounded-md border border-line bg-surface p-0.5"><button type="button" aria-label="List view" onClick={() => setView('list')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'list' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><List className="size-4" /></button><button type="button" aria-label="Board view" onClick={() => setView('kanban')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'kanban' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><Columns3 className="size-4" /></button><button type="button" aria-label="Grid view" onClick={() => setView('grid')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'grid' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><LayoutGrid className="size-4" /></button></div></div></Card>
        {view === 'kanban' ? <LeadBoard columns={kanban} canUpdate={can.update} canArchive={can.archive} canConvert={can.convert} /> : view === 'list' ? <Card><LeadsTable leads={leads} canUpdate={can.update} canArchive={can.archive} canConvert={can.convert} /><Pagination meta={leads} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card> : <><LeadsGrid leads={leads} canUpdate={can.update} canArchive={can.archive} canConvert={can.convert} /><Card className="mt-4"><Pagination meta={leads} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card></>}
    </AppLayout>;
}
