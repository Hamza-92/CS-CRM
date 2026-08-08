import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { FollowUp, UserRef } from '@/types';

interface EntityOption { id: number; name: string; business: string | null; email: string | null }
interface DealOption { id: number; title: string; customer_id: number | null; lead_id: number | null }
interface InstanceOption { id: number; name: string; customer_id: number; product_id: number }
type EntityType = 'lead' | 'customer' | 'deal' | 'instance';

function localDateTime(value: string | null | undefined): string { return value ? value.slice(0, 16) : ''; }

export function FollowUpForm({ followUp, leads, customers, deals, instances, owners, action, method, submitLabel }: { followUp?: FollowUp; leads: EntityOption[]; customers: EntityOption[]; deals: DealOption[]; instances: InstanceOption[]; owners: UserRef[]; action: string; method: 'post' | 'put'; submitLabel: string }) {
    const initialType: EntityType = followUp?.application_instance_id ? 'instance' : followUp?.deal_id ? 'deal' : followUp?.customer_id ? 'customer' : 'lead';
    const [entityType, setEntityType] = useState<EntityType>(initialType);
    const { data, setData, post, put, processing, errors } = useForm({
        lead_id: followUp?.lead_id ? String(followUp.lead_id) : '',
        customer_id: followUp?.customer_id ? String(followUp.customer_id) : '',
        deal_id: followUp?.deal_id ? String(followUp.deal_id) : '',
        application_instance_id: followUp?.application_instance_id ? String(followUp.application_instance_id) : '',
        reason: followUp?.reason ?? '', notes: followUp?.notes ?? '',
        owner_id: followUp?.owner_id ? String(followUp.owner_id) : '', scheduled_at: localDateTime(followUp?.scheduled_at),
        status: followUp?.status ?? 'pending',
    });

    const entityOptions = entityType === 'lead'
        ? leads.map((item) => ({ value: String(item.id), label: item.name, hint: item.business ?? item.email ?? undefined }))
        : entityType === 'customer'
            ? customers.map((item) => ({ value: String(item.id), label: item.name, hint: item.business ?? item.email ?? undefined }))
            : entityType === 'deal' ? deals.map((item) => ({ value: String(item.id), label: item.title, hint: item.customer_id ? 'Customer deal' : 'Lead deal' })) : instances.map((item) => ({ value: String(item.id), label: item.name, hint: 'Application instance' }));
    const entityValue = entityType === 'lead' ? data.lead_id : entityType === 'customer' ? data.customer_id : entityType === 'deal' ? data.deal_id : data.application_instance_id;
    const ownerOptions = [{ value: '', label: 'Unassigned' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name, hint: owner.email }))];

    function selectEntity(type: EntityType) {
        setEntityType(type);
        setData({ ...data, lead_id: type === 'lead' ? data.lead_id : '', customer_id: type === 'customer' ? data.customer_id : '', deal_id: type === 'deal' ? data.deal_id : '', application_instance_id: type === 'instance' ? data.application_instance_id : '' });
    }

    function setEntity(value: string) {
        if (entityType === 'lead') setData('lead_id', value);
        else if (entityType === 'customer') setData('customer_id', value);
        else if (entityType === 'deal') setData('deal_id', value);
        else setData('application_instance_id', value);
    }

    function submit(event: FormEvent) { event.preventDefault(); (method === 'post' ? post : put)(action); }

    return <form onSubmit={submit} noValidate className="space-y-4"><Card><CardHeader title="Follow-up details" /><CardBody className="grid gap-4 sm:grid-cols-2"><Field label="Linked record" error={errors.lead_id ?? errors.customer_id ?? errors.deal_id ?? errors.application_instance_id} required>{(props) => <><div className="mb-2 grid grid-cols-4 rounded-md border border-line bg-surface-2 p-0.5">{(['lead', 'customer', 'deal', 'instance'] as EntityType[]).map((type) => <button key={type} type="button" onClick={() => selectEntity(type)} className={`rounded px-2 py-1.5 text-2xs font-medium capitalize ${entityType === type ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:text-ink'}`}>{type}</button>)}</div><SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={entityOptions} value={entityValue} onChange={setEntity} placeholder={`Select ${entityType}`} searchPlaceholder={`Search ${entityType}s...`} /></>}</Field><Field label="Reason" error={errors.reason} required>{(props) => <Input {...props} placeholder="Call about next steps" value={data.reason} onChange={(event) => setData('reason', event.target.value)} />}</Field><Field label="Scheduled date and time" error={errors.scheduled_at} required>{(props) => <Input {...props} type="datetime-local" value={data.scheduled_at} onChange={(event) => setData('scheduled_at', event.target.value)} />}</Field><Field label="Owner" error={errors.owner_id}>{(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={ownerOptions} value={data.owner_id} onChange={(value) => setData('owner_id', value)} placeholder="Unassigned" searchPlaceholder="Search owners..." />}</Field><Field label="Status" error={errors.status} required>{(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={[{ value: 'pending', label: 'Pending' }, { value: 'rescheduled', label: 'Rescheduled' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' }]} value={data.status} onChange={(value) => setData('status', value as typeof data.status)} placeholder="Select status" searchPlaceholder="Search statuses..." />}</Field><Field label="Notes" error={errors.notes} className="sm:col-span-2">{(props) => <Textarea {...props} rows={5} placeholder="Context or result notes" value={data.notes} onChange={(event) => setData('notes', event.target.value)} />}</Field></CardBody><CardFooter><Link href="/follow-ups"><Button variant="secondary">Cancel</Button></Link><Button type="submit" disabled={processing}>{processing && <LoaderCircle className="animate-spin" />}{submitLabel}</Button></CardFooter></Card></form>;
}
