import { Head, Link, router } from '@inertiajs/react';
import { Archive, CalendarRange, CircleDollarSign, Columns3, List, Plus, Search, Settings2, Target, Trophy } from 'lucide-react';
import { useState } from 'react';
import { DealBoard, type DealBoardColumn } from '@/components/deals/deal-board';
import { DealsTable } from '@/components/deals/deals-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { StatCard } from '@/components/stat-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useFilters } from '@/hooks/use-filters';
import { usePersistedState } from '@/hooks/use-persisted-state';
import AppLayout from '@/layouts/app-layout';
import type { Deal, Paginated, ProductRef, UserRef } from '@/types';
import { money } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props { deals: Paginated<Deal>; board: DealBoardColumn[]; stages: { value: string; label: string; color: string; status: string }[]; owners: UserRef[]; products: ProductRef[]; filters: { search: string; stage_id: string; owner_id: string; product_id: string; sort: string; direction: string; per_page: number }; summary: { pipeline: number; weighted: number; closing_this_month: number; won_this_month: number; currency: string }; can: { create: boolean; update: boolean; archive: boolean; manage_stages: boolean } }

export default function DealsIndex({ deals, board, stages, owners, products, filters, summary, can }: Props) {
    const { values, set, setMany } = useFilters('/deals', filters);
    const [view, setView] = usePersistedState<'board' | 'list'>('crm.deals.view', 'board');
    const [archiving, setArchiving] = useState<Deal | null>(null);
    const hasFilters = Boolean(values.search || values.stage_id || values.owner_id || values.product_id);
    const stageOptions = [{ value: '', label: 'All stages' }, ...stages];
    const ownerOptions = [{ value: '', label: 'All owners' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name }))];
    const productOptions = [{ value: '', label: 'All products' }, ...products.map((product) => ({ value: String(product.id), label: product.name, hint: product.code }))];

    return <AppLayout><Head title="Deals" /><PageHeader title="Deals" badge={<Badge tone="neutral" size="sm">{deals.total}</Badge>} actions={<div className="flex items-center gap-2">{can.manage_stages && <Link href="/deal-stages"><Button variant="secondary"><Settings2 /> Stages</Button></Link>}<Link href="/deals/archived"><Button variant="secondary"><Archive /> Archived</Button></Link>{can.create && <Link href="/deals/create"><Button><Plus /> New deal</Button></Link>}</div>} /><div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Open pipeline" value={money(summary.pipeline, summary.currency)} icon={CircleDollarSign} tone="brand" /><StatCard label="Weighted forecast" value={money(summary.weighted, summary.currency)} icon={Target} tone="alt" /><StatCard label="Closing this month" value={summary.closing_this_month} icon={CalendarRange} tone="warn" /><StatCard label="Won this month" value={money(summary.won_this_month, summary.currency)} icon={Trophy} tone="ok" /></div><Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder="Search deals" aria-label="Search deals" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="w-40"><SearchableSelect options={stageOptions} value={values.stage_id ?? ''} onChange={(value) => set('stage_id', value)} placeholder="All stages" searchPlaceholder="Search stages..." /></div><div className="w-40"><SearchableSelect options={ownerOptions} value={values.owner_id ?? ''} onChange={(value) => set('owner_id', value)} placeholder="All owners" searchPlaceholder="Search owners..." /></div><div className="w-44"><SearchableSelect options={productOptions} value={values.product_id ?? ''} onChange={(value) => set('product_id', value)} placeholder="All products" searchPlaceholder="Search products..." /></div>{hasFilters && <button type="button" onClick={() => setMany({ search: '', stage_id: '', owner_id: '', product_id: '' })} className="text-xs font-medium text-brand hover:underline">Clear filters</button>}<div className="ml-auto flex rounded-md border border-line bg-surface p-0.5"><button type="button" aria-label="List view" onClick={() => setView('list')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'list' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><List className="size-4" /></button><button type="button" aria-label="Pipeline board" onClick={() => setView('board')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'board' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><Columns3 className="size-4" /></button></div></div></Card>{view === 'board' ? <DealBoard columns={board} canUpdate={can.update} /> : <Card><DealsTable deals={deals} canUpdate={can.update} canArchive={can.archive} onArchive={setArchiving} /><Pagination meta={deals} perPage={Number(values.per_page ?? 12)} onPerPageChange={(value) => set('per_page', value)} /></Card>}<Modal open={archiving !== null} onClose={() => setArchiving(null)} title="Archive deal" width="sm" footer={<><Button variant="secondary" onClick={() => setArchiving(null)}>Cancel</Button><Button variant="danger" onClick={() => { if (archiving) router.delete(`/deals/${archiving.id}`, { onFinish: () => setArchiving(null) }); }}>Archive deal</Button></>}><p className="text-xs text-ink-2">Archive <span className="font-semibold text-ink">{archiving?.title}</span>? Its activity history and follow-ups will be retained.</p></Modal></AppLayout>;
}
