import { Head, router, useForm } from '@inertiajs/react';
import { Edit3, Globe2, Lock, Palette, Plus, Search, Trash2, Unlock } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Tooltip } from '@/components/ui/tooltip';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { Paginated } from '@/types';

interface ConfigItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    status: 'active' | 'inactive';
    sort_order: number;
    leads_count: number;
    color?: string;
}

export function LeadSettingsPage({ kind, items, filters }: { kind: 'statuses' | 'sources'; items: Paginated<ConfigItem>; filters: { search: string; status: string; per_page?: number } }) {
    const isStatus = kind === 'statuses';
    const endpoint = isStatus ? '/lead-statuses' : '/lead-sources';
    const singular = isStatus ? 'status' : 'source';
    const [editing, setEditing] = useState<ConfigItem | null>(null);
    const [confirming, setConfirming] = useState<ConfigItem | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const { values, set } = useFilters(endpoint, filters);
    const { data, setData, post, put, processing, errors, reset } = useForm({ name: '', description: '', color: '#3B82F6', status: 'active' });

    useEffect(() => {
        setData(editing ? { name: editing.name, description: editing.description ?? '', color: editing.color ?? '#3B82F6', status: editing.status } : { name: '', description: '', color: '#3B82F6', status: 'active' });
    }, [editing]);

    function openNew() {
        setEditing(null);
        setModalOpen(true);
    }

    function openEdit(item: ConfigItem) {
        setEditing(item);
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditing(null);
        reset();
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        const action = editing ? `${endpoint}/${editing.id}` : endpoint;
        (editing ? put : post)(action, { preserveScroll: true, onSuccess: closeModal });
    }

    function removeItem() {
        if (!confirming) return;
        router.delete(`${endpoint}/${confirming.id}`, { preserveScroll: true, onSuccess: () => setConfirming(null) });
    }

    return <AppLayout>
        <Head title={isStatus ? 'Lead statuses' : 'Lead sources'} />
        <PageHeader title={isStatus ? 'Lead statuses' : 'Lead sources'} badge={<Badge tone="neutral" size="sm">{items.total}</Badge>} actions={<Button variant="secondary" onClick={openNew}><Plus /> New {singular}</Button>} />
        <div className="space-y-4">
            <Card><CardBody className="flex flex-wrap items-center gap-2 p-4"><div className="relative w-full max-w-sm"><Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" /><Input type="search" placeholder={`Search lead ${singular}s`} aria-label={`Search lead ${singular}s`} className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} /></div><div className="w-36"><SearchableSelect options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={values.status ?? ''} onChange={(value) => set('status', value)} placeholder="All statuses" /></div></CardBody></Card>
            <Card><CardBody className="divide-y divide-line/70 p-0">{items.data.length === 0 ? <div className="px-4 py-14 text-center text-xs text-ink-3">No {singular}s found.</div> : items.data.map((item) => <div key={item.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${item.color ?? '#3B82F6'}18`, color: item.color ?? '#3B82F6' }}>{isStatus ? <Palette className="size-4" /> : <Globe2 className="size-4" />}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-xs font-semibold text-ink">{item.name}</p><Badge tone={item.status === 'active' ? 'ok' : 'neutral'} size="sm" dot>{item.status === 'active' ? 'Active' : 'Inactive'}</Badge></div><p className="mt-0.5 truncate text-2xs text-ink-3">{item.description ?? 'No description added.'}</p></div><span className="hidden shrink-0 text-2xs text-ink-3 sm:block">{item.leads_count} leads</span><div className="flex shrink-0 items-center gap-0.5"><Tooltip label="Edit"><button type="button" onClick={() => openEdit(item)} className="flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-3 hover:text-ink"><Edit3 className="size-4" /></button></Tooltip><Tooltip label={item.status === 'active' ? 'Deactivate' : 'Activate'}><button type="button" onClick={() => router.patch(`${endpoint}/${item.id}/toggle`, {}, { preserveScroll: true })} className="flex size-8 items-center justify-center rounded-md text-ink-3 hover:bg-surface-3 hover:text-ink">{item.status === 'active' ? <Lock className="size-4" /> : <Unlock className="size-4" />}</button></Tooltip><Tooltip label="Delete"><button type="button" onClick={() => setConfirming(item)} className="flex size-8 items-center justify-center rounded-md text-bad hover:bg-bad-wash"><Trash2 className="size-4" /></button></Tooltip></div></div>)}</CardBody><Pagination meta={items} perPage={12} onPerPageChange={(value) => set('per_page', value)} /></Card>
        </div>
        <Modal open={modalOpen} onClose={closeModal} title={editing ? `Edit ${singular}` : `New ${singular}`} width="md" footer={<><Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" form="lead-config-form" disabled={processing}>{processing ? 'Saving...' : editing ? 'Save changes' : `Add ${singular}`}</Button></>}>
            <form id="lead-config-form" onSubmit={submit} noValidate className="space-y-4"><Field label={isStatus ? 'Status name' : 'Source name'} error={errors.name} required>{(props) => <Input {...props} value={data.name} onChange={(event) => setData('name', event.target.value)} />}</Field>{isStatus && <Field label="Color" error={errors.color} required>{(props) => <div className="flex items-center gap-2"><Input {...props} type="color" value={data.color} onChange={(event) => setData('color', event.target.value.toUpperCase())} aria-label="Choose status color" className="h-9 w-12 cursor-pointer p-1" /><Input value={data.color} onChange={(event) => setData('color', event.target.value.toUpperCase())} className="num uppercase" placeholder="#3B82F6" /></div>}</Field>}<Field label="Description" error={errors.description}>{(props) => <Textarea {...props} rows={3} value={data.description} onChange={(event) => setData('description', event.target.value)} />}</Field><Field label="Status" error={errors.status} required>{(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={data.status} onChange={(value) => setData('status', value)} placeholder="Select status" searchPlaceholder="Search statuses..." />}</Field></form>
        </Modal>
        <Modal open={Boolean(confirming)} onClose={() => setConfirming(null)} title={`Delete ${singular}`} width="sm" footer={<><Button type="button" variant="secondary" onClick={() => setConfirming(null)}>Cancel</Button><Button type="button" variant="danger" onClick={removeItem} disabled={Boolean(confirming?.leads_count)}>Delete {singular}</Button></>}>
            <p className="text-sm text-ink-2">Are you sure you want to delete <span className="font-semibold text-ink">{confirming?.name}</span>? This action cannot be undone.</p>
            {confirming && confirming.leads_count > 0 && <p className="mt-3 rounded-md bg-warn-wash px-3 py-2 text-xs text-warn">This {singular} is assigned to {confirming.leads_count} lead{confirming.leads_count === 1 ? '' : 's'} and cannot be deleted until those leads are reassigned.</p>}
        </Modal>
    </AppLayout>;
}
