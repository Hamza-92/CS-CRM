import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Customer, UserRef } from '@/types';

export function CustomerForm({ customer, owners, action, method, submitLabel }: { customer?: Customer; owners: UserRef[]; action: string; method: 'post' | 'put'; submitLabel: string }) {
    const { data, setData, post, put, transform, processing, errors } = useForm({
        name: customer?.name ?? '', business: customer?.business ?? '', phone: customer?.phone ?? '', whatsapp: customer?.whatsapp ?? '', email: customer?.email ?? '', city: customer?.city ?? '', source: customer?.source ?? '', status: customer?.status ?? 'active', owner_id: customer?.owner_id ? String(customer.owner_id) : '', tags: customer?.tags.join(', ') ?? '', notes: customer?.notes ?? '',
    });
    const ownerOptions = [{ value: '', label: 'Unassigned' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name, hint: owner.email }))];

    function submit(event: FormEvent) {
        event.preventDefault();
        transform((values) => ({ ...values, tags: values.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) }));
        (method === 'post' ? post : put)(action);
    }

    return <form onSubmit={submit} noValidate className="space-y-4">
        <Card><CardHeader title="Customer details" /><CardBody className="grid gap-4 sm:grid-cols-4">
            <Field label="Name" error={errors.name} required className="sm:col-span-2">{(props) => <Input {...props} value={data.name} onChange={(event) => setData('name', event.target.value)} />}</Field>
            <Field label="Business" error={errors.business} className="sm:col-span-2">{(props) => <Input {...props} value={data.business} onChange={(event) => setData('business', event.target.value)} />}</Field>
            <Field label="Email" error={errors.email}>{(props) => <Input {...props} type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} />}</Field>
            <Field label="Phone" error={errors.phone}>{(props) => <Input {...props} className="num" value={data.phone} onChange={(event) => setData('phone', event.target.value)} />}</Field>
            <Field label="WhatsApp" error={errors.whatsapp}>{(props) => <Input {...props} className="num" value={data.whatsapp} onChange={(event) => setData('whatsapp', event.target.value)} />}</Field>
            <Field label="City / location" error={errors.city}>{(props) => <Input {...props} value={data.city} onChange={(event) => setData('city', event.target.value)} />}</Field>
        </CardBody></Card>
        <Card><CardHeader title="Operations" /><CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Status" error={errors.status} required>{(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} value={data.status} onChange={(value) => setData('status', value as 'active' | 'inactive')} />}</Field>
            <Field label="Owner" error={errors.owner_id}>{(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={ownerOptions} value={data.owner_id} onChange={(value) => setData('owner_id', value)} placeholder="Unassigned" searchPlaceholder="Search owners..." />}</Field>
            <Field label="Source" error={errors.source}>{(props) => <Input {...props} value={data.source} onChange={(event) => setData('source', event.target.value)} />}</Field>
            <Field label="Tags" error={errors.tags} hint="Separate tags with commas.">{(props) => <Input {...props} value={data.tags} onChange={(event) => setData('tags', event.target.value)} />}</Field>
            <Field label="Notes" error={errors.notes} className="sm:col-span-2">{(props) => <Textarea {...props} rows={5} value={data.notes} onChange={(event) => setData('notes', event.target.value)} />}</Field>
        </CardBody><CardFooter><Link href={customer ? `/customers/${customer.id}` : '/customers'}><Button variant="secondary">Cancel</Button></Link><Button type="submit" disabled={processing}>{processing && <LoaderCircle className="animate-spin" />}{submitLabel}</Button></CardFooter></Card>
    </form>;
}
