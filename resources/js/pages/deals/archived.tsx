import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
import { useState } from 'react';
import { DealsTable } from '@/components/deals/deals-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { Deal, Paginated, ProductRef, UserRef } from '@/types';

interface Props { deals: Paginated<Deal>; stages: { value: string; label: string; color: string; status: string }[]; owners: UserRef[]; products: ProductRef[]; filters: { search: string; stage_id: string; owner_id: string; product_id: string; per_page: number }; can: { update: boolean; archive: boolean } }

export default function ArchivedDeals({ deals, stages, owners, products, filters, can }: Props) {
    const { values, set } = useFilters('/deals/archived', filters);
    const [restoring, setRestoring] = useState<Deal | null>(null);
    return <AppLayout><Head title="Archived deals" /><PageHeader title="Archived deals" badge={<Badge tone="neutral" size="sm">{deals.total}</Badge>} actions={<Link href="/deals"><Button variant="secondary"><ArrowLeft /> Back to Deals</Button></Link>} /><Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder="Search archived deals" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="w-40"><SearchableSelect options={[{ value: '', label: 'All stages' }, ...stages]} value={values.stage_id ?? ''} onChange={(value) => set('stage_id', value)} placeholder="All stages" /></div><div className="w-40"><SearchableSelect options={[{ value: '', label: 'All owners' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name }))]} value={values.owner_id ?? ''} onChange={(value) => set('owner_id', value)} placeholder="All owners" /></div><div className="w-44"><SearchableSelect options={[{ value: '', label: 'All products' }, ...products.map((product) => ({ value: String(product.id), label: product.name }))]} value={values.product_id ?? ''} onChange={(value) => set('product_id', value)} placeholder="All products" /></div></div></Card><Card><DealsTable deals={deals} archived canUpdate={can.update} canArchive={can.archive} onRestore={setRestoring} /><Pagination meta={deals} perPage={Number(values.per_page ?? 12)} onPerPageChange={(value) => set('per_page', value)} /></Card><Modal open={restoring !== null} onClose={() => setRestoring(null)} title="Restore deal" width="sm" footer={<><Button variant="secondary" onClick={() => setRestoring(null)}>Cancel</Button><Button onClick={() => { if (restoring) router.patch(`/deals/${restoring.id}/restore`, {}, { onFinish: () => setRestoring(null) }); }}>Restore deal</Button></>}><p className="text-xs text-ink-2">Restore <span className="font-semibold text-ink">{restoring?.title}</span> to the active pipeline?</p></Modal></AppLayout>;
}
