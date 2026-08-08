import { Head, Link, router } from '@inertiajs/react';
import { AlertCircle, CalendarCheck2, CalendarClock, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { FollowUpsTable } from '@/components/follow-ups/follow-ups-table';
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
import AppLayout from '@/layouts/app-layout';
import type { FollowUp, Paginated, UserRef } from '@/types';

type FilterState = { search: string; status: string; owner_id: string; view: string; per_page: number };

export default function FollowUpsIndex({ followUps, owners, filters, summary, can }: { followUps: Paginated<FollowUp>; owners: UserRef[]; filters: FilterState; summary: { today: number; overdue: number; pending: number }; can: { create: boolean; update: boolean; delete: boolean; complete: boolean } }) {
    const { values, set, setMany } = useFilters('/follow-ups', filters);
    const [confirming, setConfirming] = useState<{ action: 'cancel' | 'delete'; followUp: FollowUp } | null>(null);
    const [completing, setCompleting] = useState<FollowUp | null>(null);
    const [nextScheduledAt, setNextScheduledAt] = useState('');
    const ownerOptions = [{ value: '', label: 'All owners' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name }))];
    const statusOptions = [{ value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'rescheduled', label: 'Rescheduled' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }];
    const hasFilters = Boolean(values.search || values.status || values.owner_id || values.view);

    function complete(followUp: FollowUp, createNext = false) {
        router.patch(`/follow-ups/${followUp.id}/complete`, createNext ? { create_next: true, next_scheduled_at: nextScheduledAt } : {}, { preserveScroll: true, onSuccess: () => { setCompleting(null); setNextScheduledAt(''); } });
    }

    function confirmAction() {
        if (!confirming) return;
        const { action, followUp } = confirming;
        const callback = () => setConfirming(null);
        if (action === 'cancel') router.patch(`/follow-ups/${followUp.id}/cancel`, {}, { preserveScroll: true, onSuccess: callback });
        else router.delete(`/follow-ups/${followUp.id}`, { preserveScroll: true, onSuccess: callback });
    }

    return <AppLayout><Head title="Follow-ups" /><PageHeader title="Follow-ups" badge={<Badge tone="neutral" size="sm">{followUps.total}</Badge>} actions={can.create && <Link href="/follow-ups/create"><Button><Plus /> New follow-up</Button></Link>} /><div className="mb-4 grid gap-3 sm:grid-cols-3"><StatCard label="Today" value={summary.today} icon={CalendarCheck2} tone="brand" href="/follow-ups?view=today" /><StatCard label="Overdue" value={summary.overdue} icon={AlertCircle} tone="bad" href="/follow-ups?view=overdue" /><StatCard label="Open follow-ups" value={summary.pending} icon={CalendarClock} tone="info" /></div><Card className="mb-4 p-4"><div className="flex flex-wrap items-center gap-2"><div className="relative w-full max-w-xs"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder="Search follow-ups" aria-label="Search follow-ups" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="w-40"><SearchableSelect options={statusOptions} value={values.status ?? ''} onChange={(value) => set('status', value)} placeholder="All statuses" searchPlaceholder="Search statuses..." /></div><div className="w-40"><SearchableSelect options={ownerOptions} value={values.owner_id ?? ''} onChange={(value) => set('owner_id', value)} placeholder="All owners" searchPlaceholder="Search owners..." /></div><div className="flex items-center rounded-md border border-line bg-surface p-0.5"><button type="button" onClick={() => set('view', '')} className={`rounded px-2.5 py-1.5 text-2xs font-medium ${!values.view ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:text-ink'}`}>All</button><button type="button" onClick={() => set('view', 'today')} className={`rounded px-2.5 py-1.5 text-2xs font-medium ${values.view === 'today' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:text-ink'}`}>Today</button><button type="button" onClick={() => set('view', 'overdue')} className={`rounded px-2.5 py-1.5 text-2xs font-medium ${values.view === 'overdue' ? 'bg-bad text-brand-ink' : 'text-ink-3 hover:text-ink'}`}>Overdue</button></div>{hasFilters && <button type="button" onClick={() => setMany({ search: '', status: '', owner_id: '', view: '' })} className="text-xs font-medium text-brand hover:underline">Clear filters</button>}</div></Card><Card className="overflow-visible"><FollowUpsTable followUps={followUps} canUpdate={can.update} canDelete={can.delete} canComplete={can.complete} onComplete={(followUp) => { setCompleting(followUp); setNextScheduledAt(''); }} onCancel={(followUp) => setConfirming({ action: 'cancel', followUp })} onDelete={(followUp) => setConfirming({ action: 'delete', followUp })} /><Pagination meta={followUps} perPage={Number(values.per_page ?? 12)} onPerPageChange={(value) => set('per_page', value)} /></Card><Modal open={Boolean(completing)} onClose={() => setCompleting(null)} title="Complete follow-up" width="sm" footer={<><Button type="button" variant="secondary" onClick={() => complete(completing!)}>Complete only</Button><Button type="button" onClick={() => complete(completing!, true)} disabled={!nextScheduledAt}>Complete & schedule next</Button></>}><p className="text-sm text-ink-2">Mark <span className="font-semibold text-ink">{completing?.reason}</span> as completed.</p><div className="mt-4"><label className="text-xs font-medium text-ink" htmlFor="next-follow-up">Next follow-up date and time <span className="font-normal text-ink-3">(optional)</span></label><Input id="next-follow-up" type="datetime-local" className="mt-1.5" value={nextScheduledAt} onChange={(event) => setNextScheduledAt(event.target.value)} /></div></Modal><Modal open={Boolean(confirming)} onClose={() => setConfirming(null)} title={confirming?.action === 'delete' ? 'Delete follow-up' : 'Cancel follow-up'} width="sm" footer={<><Button type="button" variant="secondary" onClick={() => setConfirming(null)}>Keep follow-up</Button><Button type="button" variant="danger" onClick={confirmAction}>{confirming?.action === 'delete' ? 'Delete follow-up' : 'Cancel follow-up'}</Button></>}><p className="text-sm text-ink-2">Are you sure you want to {confirming?.action === 'delete' ? 'delete' : 'cancel'} <span className="font-semibold text-ink">{confirming?.followUp.reason}</span> for <span className="font-semibold text-ink">{confirming?.followUp.subject?.name ?? 'this record'}</span>?</p></Modal></AppLayout>;
}
