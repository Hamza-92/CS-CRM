import { Head, Link } from '@inertiajs/react';
import { Archive, Download, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { CustomersGrid, CustomersTable } from '@/components/customers/customers-table';
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
import type { Customer, Paginated, UserRef } from '@/types';
import { cn } from '@/lib/utils';

interface Props { customers: Paginated<Customer>; owners: UserRef[]; filters: { search: string; status: string; owner_id: string; sort: string; direction: 'asc' | 'desc'; per_page: number }; can: { create: boolean; update: boolean; archive: boolean } }

export default function CustomersIndex({ customers, owners, filters, can }: Props) {
    const { values, set, setMany } = useFilters('/customers', filters);
    const [view, setView] = usePersistedState<'list' | 'grid'>('crm.customers.view', 'list');
    const hasFilters = Boolean(values.search || values.status || values.owner_id);
    const ownerOptions = [{ value: '', label: 'All owners' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name }))];
    return <AppLayout><Head title="Customers" /><PageHeader title="Customers" badge={<Badge tone="neutral" size="sm">{customers.total}</Badge>} actions={<div className="flex items-center gap-2"><Link href="/customers/export"><Button variant="secondary"><Download /> Export</Button></Link><Link href="/customers/archived"><Button variant="secondary"><Archive /> Archived</Button></Link>{can.create && <Link href="/customers/create"><Button><Plus /> New customer</Button></Link>}</div>} /><Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder="Search customers" aria-label="Search customers" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="w-36"><SearchableSelect options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={values.status ?? ''} onChange={(value) => set('status', value)} placeholder="All statuses" searchPlaceholder="Search statuses..." /></div><div className="w-40"><SearchableSelect options={ownerOptions} value={values.owner_id ?? ''} onChange={(value) => set('owner_id', value)} placeholder="All owners" searchPlaceholder="Search owners..." /></div>{hasFilters && <button type="button" onClick={() => setMany({ search: '', status: '', owner_id: '' })} className="text-xs font-medium text-brand hover:underline">Clear filters</button>}<div className="ml-auto flex rounded-md border border-line bg-surface p-0.5"><button type="button" aria-label="List view" onClick={() => setView('list')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'list' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><List className="size-4" /></button><button type="button" aria-label="Grid view" onClick={() => setView('grid')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'grid' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><LayoutGrid className="size-4" /></button></div></div></Card>{view === 'list' ? <Card><CustomersTable customers={customers} canUpdate={can.update} canArchive={can.archive} /><Pagination meta={customers} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card> : <><CustomersGrid customers={customers} canUpdate={can.update} canArchive={can.archive} /><Card className="mt-4"><Pagination meta={customers} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card></>}</AppLayout>;
}
