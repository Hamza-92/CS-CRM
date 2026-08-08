import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { FollowUp, UserRef } from '@/types';

interface EntityOption { id: number; name: string; business: string | null; email: string | null }

function localDateTime(value: string | null | undefined): string {
    return value ? value.slice(0, 16) : '';
}

export function FollowUpForm({ followUp, leads, customers, owners, action, method, submitLabel }: { followUp?: FollowUp; leads: EntityOption[]; customers: EntityOption[]; owners: UserRef[]; action: string; method: 'post' | 'put'; submitLabel: string }) {
    const [entityType, setEntityType] = useState<'lead' | 'customer'>(followUp?.customer_id ? 'customer' : 'lead');
    const { data, setData, post, put, processing, errors } = useForm({
        lead_id: followUp?.lead_id ? String(followUp.lead_id) : '',
        customer_id: followUp?.customer_id ? String(followUp.customer_id) : '',
        reason: followUp?.reason ?? '',
        notes: followUp?.notes ?? '',
        owner_id: followUp?.owner_id ? String(followUp.owner_id) : '',
        scheduled_at: localDateTime(followUp?.scheduled_at),
        status: followUp?.status ?? 'pending',
    });

    const leadOptions = leads.map((lead) => ({ value: String(lead.id), label: lead.name, hint: lead.business ?? lead.email ?? undefined }));
    const customerOptions = customers.map((customer) => ({ value: String(customer.id), label: customer.name, hint: customer.business ?? customer.email ?? undefined }));
    const ownerOptions = [{ value: '', label: 'Unassigned' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name, hint: owner.email }))];

    function selectEntity(type: 'lead' | 'customer') {
        setEntityType(type);
        setData(type === 'lead' ? { lead_id: data.lead_id, customer_id: '', reason: data.reason, notes: data.notes, owner_id: data.owner_id, scheduled_at: data.scheduled_at, status: data.status } : { lead_id: '', customer_id: data.customer_id, reason: data.reason, notes: data.notes, owner_id: data.owner_id, scheduled_at: data.scheduled_at, status: data.status });
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        (method === 'post' ? post : put)(action);
    }

    return <form onSubmit={submit} noValidate className="space-y-4"><Card><CardHeader title="Follow-up details" /><CardBody className="grid gap-4 sm:grid-cols-2"><Field label="Linked record" error={errors.lead_id ?? errors.customer_id} required>{(props) => <><div className="mb-2 flex rounded-md border border-line bg-surface-2 p-0.5"><button type="button" onClick={() => selectEntity('lead')} className={`flex-1 rounded px-2 py-1.5 text-2xs font-medium ${entityType === 'lead' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:text-ink'}`}>Lead</button><button type="button" onClick={() => selectEntity('customer')} className={`flex-1 rounded px-2 py-1.5 text-2xs font-medium ${entityType === 'customer' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:text-ink'}`}>Customer</button></div><SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={entityType === 'lead' ? leadOptions : customerOptions} value={entityType === 'lead' ? data.lead_id : data.customer_id} onChange={(value) => setData(entityType === 'lead' ? 'lead_id' : 'customer_id', value)} placeholder={`Select ${entityType}`} searchPlaceholder={`Search ${entityType}s...`} /></>}</Field><Field label="Reason" error={errors.reason} required>{(props) => <Input {...props} placeholder="Call about renewal" value={data.reason} onChange={(event) => setData('reason', event.target.value)} />}</Field><Field label="Scheduled date and time" error={errors.scheduled_at} required>{(props) => <Input {...props} type="datetime-local" value={data.scheduled_at} onChange={(event) => setData('scheduled_at', event.target.value)} />}</Field><Field label="Owner" error={errors.owner_id}>{(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={ownerOptions} value={data.owner_id} onChange={(value) => setData('owner_id', value)} placeholder="Unassigned" searchPlaceholder="Search owners..." />}</Field><Field label="Status" error={errors.status} required>{(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={[{ value: 'pending', label: 'Pending' }, { value: 'rescheduled', label: 'Rescheduled' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]} value={data.status} onChange={(value) => setData('status', value as typeof data.status)} placeholder="Select status" searchPlaceholder="Search statuses..." />}</Field><Field label="Notes" error={errors.notes} className="sm:col-span-2">{(props) => <Textarea {...props} rows={5} placeholder="Context or result notes" value={data.notes} onChange={(event) => setData('notes', event.target.value)} />}</Field></CardBody><CardFooter><Link href="/follow-ups"><Button variant="secondary">Cancel</Button></Link><Button type="submit" disabled={processing}>{processing && <LoaderCircle className="animate-spin" />}{submitLabel}</Button></CardFooter></Card></form>;
}
