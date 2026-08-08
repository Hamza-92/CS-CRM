import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, LayoutGrid, List, Search } from 'lucide-react';
import { CustomersGrid, CustomersTable } from '@/components/customers/customers-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { useAuth } from '@/hooks/use-auth';
import { useFilters } from '@/hooks/use-filters';
import { usePersistedState } from '@/hooks/use-persisted-state';
import AppLayout from '@/layouts/app-layout';
import type { Customer, Paginated } from '@/types';
import { cn } from '@/lib/utils';

export default function CustomersArchived({ customers, filters }: { customers: Paginated<Customer>; filters: { search: string; status: string; owner_id: string; sort: string; direction: 'asc' | 'desc'; per_page: number } }) {
    const { values, set } = useFilters('/customers/archived', filters);
    const { can } = useAuth();
    const [view, setView] = usePersistedState<'list' | 'grid'>('crm.customers.view', 'list');
    const archive = can('customers.archive') || can('customers.manage');
    return <AppLayout><Head title="Archived customers" /><PageHeader title="Archived customers" badge={<Badge tone="neutral" size="sm">{customers.total}</Badge>} actions={<Link href="/customers"><Button variant="secondary"><ArrowLeft /> Back to Customers</Button></Link>} /><Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder="Search archived customers" aria-label="Search archived customers" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="ml-auto flex rounded-md border border-line bg-surface p-0.5"><button type="button" aria-label="List view" onClick={() => setView('list')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'list' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><List className="size-4" /></button><button type="button" aria-label="Grid view" onClick={() => setView('grid')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', view === 'grid' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><LayoutGrid className="size-4" /></button></div></div></Card>{view === 'list' ? <Card><CustomersTable customers={customers} archived canUpdate={false} canArchive={archive} /><Pagination meta={customers} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card> : <><CustomersGrid customers={customers} archived canUpdate={false} canArchive={archive} /><Card className="mt-4"><Pagination meta={customers} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card></>}</AppLayout>;
}
