import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckboxField, Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Lead, ProductRef, UserRef } from '@/types';

interface Option { value: string; label: string }

function localDateTime(value: string | null | undefined): string {
    return value ? value.slice(0, 16) : '';
}

export function LeadForm({
    lead,
    owners,
    products,
    statuses,
    sources,
    action,
    method,
    submitLabel,
    defaultStatus,
}: {
    lead?: Lead;
    owners: UserRef[];
    products: ProductRef[];
    statuses: Option[];
    sources: Option[];
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
    defaultStatus?: string;
}) {
    const { data, setData, post, put, processing, errors } = useForm({
        name: lead?.name ?? '',
        business: lead?.business ?? '',
        phone: lead?.phone ?? '',
        whatsapp: lead?.whatsapp ?? '',
        email: lead?.email ?? '',
        city: lead?.city ?? '',
        source: lead?.source ?? '',
        status: lead?.status ?? defaultStatus ?? 'new',
        owner_id: lead?.owner_id ? String(lead.owner_id) : '',
        interested_products: (lead?.interested_products ?? []).map(String),
        next_follow_up_at: localDateTime(lead?.next_follow_up_at),
        notes: lead?.notes ?? '',
    });

    const ownerOptions = [{ value: '', label: 'Unassigned' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name, hint: owner.email }))];

    function submit(event: FormEvent) {
        event.preventDefault();
        (method === 'post' ? post : put)(action);
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <Card>
                <CardHeader title="Lead details" />
                <CardBody className="grid gap-4 sm:grid-cols-4">
                    <Field label="Name" error={errors.name} required className="sm:col-span-2">
                        {(props) => <Input {...props} value={data.name} onChange={(event) => setData('name', event.target.value)} />}
                    </Field>
                    <Field label="Business" error={errors.business} className="sm:col-span-2">
                        {(props) => <Input {...props} value={data.business} onChange={(event) => setData('business', event.target.value)} />}
                    </Field>
                    <Field label="Email" error={errors.email}>
                        {(props) => <Input {...props} type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} />}
                    </Field>
                    <Field label="Phone" error={errors.phone}>
                        {(props) => <Input {...props} className="num" value={data.phone} onChange={(event) => setData('phone', event.target.value)} />}
                    </Field>
                    <Field label="WhatsApp" error={errors.whatsapp}>
                        {(props) => <Input {...props} className="num" value={data.whatsapp} onChange={(event) => setData('whatsapp', event.target.value)} />}
                    </Field>
                    <Field label="City / location" error={errors.city}>
                        {(props) => <Input {...props} value={data.city} onChange={(event) => setData('city', event.target.value)} />}
                    </Field>
                </CardBody>
            </Card>

            <Card>
                <CardHeader title="Qualification" />
                <CardBody className="grid gap-4 sm:grid-cols-2">
                    <Field label="Status" error={errors.status} required>
                        {(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={statuses} value={data.status} onChange={(value) => setData('status', value)} searchPlaceholder="Search statuses..." />}
                    </Field>
                    <Field label="Source" error={errors.source}>
                        {(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={[{ value: '', label: 'Not specified' }, ...sources]} value={data.source} onChange={(value) => setData('source', value)} placeholder="Not specified" searchPlaceholder="Search sources..." />}
                    </Field>
                    <Field label="Lead owner" error={errors.owner_id}>
                        {(props) => <SearchableSelect id={props.id} invalid={props['aria-invalid']} describedBy={props['aria-describedby']} options={ownerOptions} value={data.owner_id} onChange={(value) => setData('owner_id', value)} placeholder="Unassigned" searchPlaceholder="Search owners..." />}
                    </Field>
                    <Field label="Next follow-up" error={errors.next_follow_up_at} hint="Use a scheduled time for Call later and active opportunities.">
                        {(props) => <Input {...props} type="datetime-local" value={data.next_follow_up_at} onChange={(event) => setData('next_follow_up_at', event.target.value)} />}
                    </Field>
                    <div className="sm:col-span-2">
                        <p className="mb-1.5 text-xs font-medium text-ink">Interested products</p>
                        <div className="grid gap-2 rounded-md border border-line bg-surface-2 p-3 sm:grid-cols-2">
                            {products.map((product) => <CheckboxField key={product.id} label={`${product.name} (${product.code})`} checked={data.interested_products.includes(String(product.id))} onChange={(checked) => setData('interested_products', checked ? [...data.interested_products, String(product.id)] : data.interested_products.filter((id) => id !== String(product.id)))} />)}
                            {products.length === 0 && <p className="text-2xs text-ink-3">Create an active product before assigning interest.</p>}
                        </div>
                        {errors.interested_products && <p className="mt-1 text-2xs font-medium text-bad">{errors.interested_products}</p>}
                    </div>
                    <Field label="Notes" error={errors.notes} className="sm:col-span-2">
                        {(props) => <Textarea {...props} rows={4} value={data.notes} onChange={(event) => setData('notes', event.target.value)} />}
                    </Field>
                </CardBody>
                <CardFooter>
                    <Link href={lead ? `/leads/${lead.id}` : '/leads'}><Button variant="secondary">Cancel</Button></Link>
                    <Button type="submit" disabled={processing}>{processing && <LoaderCircle className="animate-spin" />}{submitLabel}</Button>
                </CardFooter>
            </Card>
        </form>
    );
}
