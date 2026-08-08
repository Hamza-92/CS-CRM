import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { ApplicationInstance, ProductRef, UserRef } from '@/types';

type Ref = { id: number; name: string; business?: string | null; email?: string | null; code?: string };

export function ApplicationInstanceForm({ instance, customers, products, owners, action, method, submitLabel }: { instance?: ApplicationInstance; customers: Ref[]; products: ProductRef[]; owners: UserRef[]; action: string; method: 'post' | 'put'; submitLabel: string }) {
    const { data, setData, post, put, transform, processing, errors } = useForm({
        customer_id: instance?.customer_id ? String(instance.customer_id) : '', product_id: instance?.product_id ? String(instance.product_id) : '', owner_id: instance?.owner_id ? String(instance.owner_id) : '', name: instance?.name ?? '', environment: instance?.environment ?? 'production', status: instance?.status ?? 'planned', deployment_url: instance?.deployment_url ?? '', server_name: instance?.server_name ?? '', version: instance?.version ?? '', deployed_at: instance?.deployed_at?.slice(0, 10) ?? '', notes: instance?.notes ?? '',
    });
    const selectProps = (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ({ id: props.id, invalid: props['aria-invalid'], describedBy: props['aria-describedby'] });
    const customerOptions = customers.map((customer) => ({ value: String(customer.id), label: customer.name, hint: customer.business || customer.email || undefined }));
    const productOptions = products.map((product) => ({ value: String(product.id), label: product.name, hint: product.code }));
    const ownerOptions = [{ value: '', label: 'Unassigned' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name, hint: owner.email }))];

    function submit(event: FormEvent) {
        event.preventDefault();
        transform((values) => ({ ...values, customer_id: Number(values.customer_id), product_id: Number(values.product_id), owner_id: values.owner_id ? Number(values.owner_id) : null }));
        (method === 'post' ? post : put)(action);
    }

    return <form onSubmit={submit} noValidate className="space-y-4">
        <Card><CardHeader title="Instance details" /><CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Customer" error={errors.customer_id} required className="lg:col-span-2">{(props) => <SearchableSelect {...selectProps(props)} options={customerOptions} value={data.customer_id} onChange={(value) => setData('customer_id', value)} placeholder="Select customer" searchPlaceholder="Search customers..." />}</Field>
            <Field label="Product" error={errors.product_id} required className="lg:col-span-2">{(props) => <SearchableSelect {...selectProps(props)} options={productOptions} value={data.product_id} onChange={(value) => setData('product_id', value)} placeholder="Select product" searchPlaceholder="Search products..." />}</Field>
            <Field label="Instance name" error={errors.name} required className="lg:col-span-2">{(props) => <Input {...props} value={data.name} onChange={(event) => setData('name', event.target.value)} placeholder="Main production" />}</Field>
            <Field label="Owner" error={errors.owner_id}>{(props) => <SearchableSelect {...selectProps(props)} options={ownerOptions} value={data.owner_id} onChange={(value) => setData('owner_id', value)} placeholder="Unassigned" searchPlaceholder="Search owners..." />}</Field>
            <Field label="Environment" error={errors.environment} required>{(props) => <SearchableSelect {...selectProps(props)} options={['demo', 'staging', 'production', 'sandbox'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} value={data.environment} onChange={(value) => setData('environment', value as typeof data.environment)} />}</Field>
            <Field label="Status" error={errors.status} required>{(props) => <SearchableSelect {...selectProps(props)} options={['planned', 'active', 'paused', 'retired'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} value={data.status} onChange={(value) => setData('status', value as typeof data.status)} />}</Field>
            <Field label="Version" error={errors.version}>{(props) => <Input {...props} value={data.version} onChange={(event) => setData('version', event.target.value)} placeholder="v1.0.0" />}</Field>
        </CardBody></Card>
        <Card><CardHeader title="Deployment" /><CardBody className="grid gap-4 sm:grid-cols-2">
            <Field label="Deployment URL" error={errors.deployment_url}>{(props) => <Input {...props} type="url" value={data.deployment_url} onChange={(event) => setData('deployment_url', event.target.value)} placeholder="https://app.example.com" />}</Field>
            <Field label="Server / host" error={errors.server_name}>{(props) => <Input {...props} value={data.server_name} onChange={(event) => setData('server_name', event.target.value)} placeholder="Production cluster" />}</Field>
            <Field label="Deployed on" error={errors.deployed_at}>{(props) => <Input {...props} type="date" value={data.deployed_at} onChange={(event) => setData('deployed_at', event.target.value)} />}</Field>
            <Field label="Notes" error={errors.notes} className="sm:col-span-2">{(props) => <Textarea {...props} rows={4} value={data.notes} onChange={(event) => setData('notes', event.target.value)} placeholder="Operational notes (never store credentials here)." />}</Field>
        </CardBody><CardFooter><Link href={instance ? `/instances/${instance.id}` : '/instances'}><Button variant="secondary">Cancel</Button></Link><Button type="submit" disabled={processing}>{processing && <LoaderCircle className="animate-spin" />}{submitLabel}</Button></CardFooter></Card>
    </form>;
}
