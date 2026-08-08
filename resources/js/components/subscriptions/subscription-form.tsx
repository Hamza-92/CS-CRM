import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Plan, Subscription } from '@/types';

type InstanceOption = { id: number; name: string; customer?: { name: string; business?: string | null } | null; product?: { name: string; code: string } | null; environment?: string; status?: string };

export function SubscriptionForm({ subscription, instances, plans, action, method, submitLabel }: { subscription?: Subscription; instances: InstanceOption[]; plans: Plan[]; action: string; method: 'post' | 'put'; submitLabel: string }) {
    const { data, setData, post, put, transform, processing, errors } = useForm({
        application_instance_id: subscription?.application_instance_id ? String(subscription.application_instance_id) : '',
        plan_id: subscription?.plan_id ? String(subscription.plan_id) : '',
        kind: subscription?.kind ?? 'subscription', status: subscription?.status ?? 'active',
        starts_at: subscription?.starts_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10), ends_at: subscription?.ends_at?.slice(0, 10) ?? '', renewal_at: subscription?.renewal_at?.slice(0, 10) ?? '', grace_ends_at: subscription?.grace_ends_at?.slice(0, 10) ?? '', cancelled_at: subscription?.cancelled_at?.slice(0, 10) ?? '', auto_renew: subscription?.auto_renew ?? true, external_reference: subscription?.external_reference ?? '', notes: subscription?.notes ?? '',
    });
    const selectProps = (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ({ id: props.id, invalid: props['aria-invalid'], describedBy: props['aria-describedby'] });
    const instanceOptions = instances.map((instance) => ({ value: String(instance.id), label: instance.name, hint: instance.customer?.business || instance.customer?.name || instance.product?.name }));
    const planOptions = plans.map((plan) => ({ value: String(plan.id), label: plan.name, hint: `${plan.code} · ${plan.billing_cycle.replace(/_/g, ' ')}` }));
    const statusOptions = ['trialing', 'active', 'past_due', 'paused', 'expired', 'cancelled'].map((value) => ({ value, label: value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }));

    function submit(event: FormEvent) {
        event.preventDefault();
        transform((values) => ({ ...values, application_instance_id: Number(values.application_instance_id), plan_id: Number(values.plan_id), auto_renew: Boolean(values.auto_renew) }));
        (method === 'post' ? post : put)(action);
    }

    return <form onSubmit={submit} noValidate className="space-y-4"><Card><CardHeader title="Subscription details" /><CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Application instance" error={errors.application_instance_id} required className="lg:col-span-2">{(props) => <SearchableSelect {...selectProps(props)} options={instanceOptions} value={data.application_instance_id} onChange={(value) => setData('application_instance_id', value)} placeholder="Select instance" searchPlaceholder="Search instances..." />}</Field>
        <Field label="Plan" error={errors.plan_id} required className="lg:col-span-2">{(props) => <SearchableSelect {...selectProps(props)} options={planOptions} value={data.plan_id} onChange={(value) => setData('plan_id', value)} placeholder="Select plan" searchPlaceholder="Search plans..." />}</Field>
        <Field label="Record type" error={errors.kind} required>{(props) => <SearchableSelect {...selectProps(props)} options={[{ value: 'trial', label: 'Trial' }, { value: 'subscription', label: 'Subscription' }]} value={data.kind} onChange={(value) => setData('kind', value as typeof data.kind)} />}</Field>
        <Field label="Status" error={errors.status} required>{(props) => <SearchableSelect {...selectProps(props)} options={statusOptions} value={data.status} onChange={(value) => setData('status', value as typeof data.status)} />}</Field>
        <Field label="Starts on" error={errors.starts_at} required>{(props) => <Input {...props} type="date" value={data.starts_at} onChange={(event) => setData('starts_at', event.target.value)} />}</Field>
        <Field label="Ends on" error={errors.ends_at} hint="Leave blank for lifetime plans.">{(props) => <Input {...props} type="date" value={data.ends_at} onChange={(event) => setData('ends_at', event.target.value)} />}</Field>
        <Field label="Renewal date" error={errors.renewal_at}>{(props) => <Input {...props} type="date" value={data.renewal_at} onChange={(event) => setData('renewal_at', event.target.value)} />}</Field>
        <Field label="Grace period ends" error={errors.grace_ends_at}>{(props) => <Input {...props} type="date" value={data.grace_ends_at} onChange={(event) => setData('grace_ends_at', event.target.value)} />}</Field>
    </CardBody></Card><Card><CardHeader title="Renewal & reference" /><CardBody className="grid gap-4 sm:grid-cols-2"><Field label="External reference" error={errors.external_reference}>{(props) => <Input {...props} value={data.external_reference} onChange={(event) => setData('external_reference', event.target.value)} placeholder="Invoice or contract reference" />}</Field><Field label="Cancelled on" error={errors.cancelled_at}>{(props) => <Input {...props} type="date" value={data.cancelled_at} onChange={(event) => setData('cancelled_at', event.target.value)} />}</Field><label className="flex items-center gap-2 text-sm text-ink-2 sm:col-span-2"><input type="checkbox" className="size-4 rounded border-line accent-brand" checked={data.auto_renew} onChange={(event) => setData('auto_renew', event.target.checked)} /> Automatically renew when the current term ends</label><Field label="Notes" error={errors.notes} className="sm:col-span-2">{(props) => <Textarea {...props} rows={4} value={data.notes} onChange={(event) => setData('notes', event.target.value)} placeholder="Commercial or lifecycle notes" />}</Field></CardBody><CardFooter><Link href={subscription ? `/subscriptions/${subscription.id}` : '/subscriptions'}><Button variant="secondary">Cancel</Button></Link><Button type="submit" disabled={processing}>{processing && <LoaderCircle className="animate-spin" />}{submitLabel}</Button></CardFooter></Card></form>;
}
