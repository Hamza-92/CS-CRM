import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Payment, Subscription } from '@/types';

type SubscriptionOption = Pick<Subscription, 'id' | 'status' | 'kind'> & { application_instance?: { name: string; customer?: { name: string; business?: string | null } | null } | null; plan?: { name: string; code: string; currency?: string } | null };

export function PaymentForm({ payment, subscriptions, currencies, defaultCurrency, action, method, submitLabel }: { payment?: Payment; subscriptions: SubscriptionOption[]; currencies: string[]; defaultCurrency?: string; action: string; method: 'post' | 'put'; submitLabel: string }) {
    const { data, setData, post, put, transform, processing, errors } = useForm({
        subscription_id: payment?.subscription_id ? String(payment.subscription_id) : '',
        invoice_number: payment?.invoice_number ?? '', amount: payment?.amount ?? '', currency: payment?.currency ?? defaultCurrency ?? 'USD',
        status: payment?.status ?? 'pending', method: payment?.method ?? '', due_at: payment?.due_at?.slice(0, 10) ?? '', paid_at: payment?.paid_at?.slice(0, 10) ?? '', reference: payment?.reference ?? '', notes: payment?.notes ?? '',
    });
    const selectProps = (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ({ id: props.id, invalid: props['aria-invalid'], describedBy: props['aria-describedby'] });
    const subscriptionOptions = subscriptions.map((item) => ({ value: String(item.id), label: item.plan?.name ? `${item.plan.name} · ${item.application_instance?.name || 'Instance'}` : `Subscription #${item.id}`, hint: item.application_instance?.customer?.business || item.application_instance?.customer?.name || item.kind }));
    const statusOptions = ['pending', 'partially_paid', 'paid', 'failed', 'refunded', 'void'].map((value) => ({ value, label: value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }));
    const methodOptions = [{ value: '', label: 'Not specified' }, ...['bank_transfer', 'card', 'cash', 'online', 'other'].map((value) => ({ value, label: value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) }))];
    function submit(event: FormEvent) { event.preventDefault(); transform((values) => ({ ...values, subscription_id: Number(values.subscription_id), amount: Number(values.amount) })); (method === 'post' ? post : put)(action); }
    return <form onSubmit={submit} noValidate className="space-y-4">
        <Card><CardHeader title="Payment details" /><CardBody className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Subscription" error={errors.subscription_id} required className="lg:col-span-2">{(props) => <SearchableSelect {...selectProps(props)} options={subscriptionOptions} value={data.subscription_id} onChange={(value) => setData('subscription_id', value)} placeholder="Select subscription" searchPlaceholder="Search subscriptions..." />}</Field>
            <Field label="Invoice number" error={errors.invoice_number} required>{(props) => <Input {...props} value={data.invoice_number} onChange={(event) => setData('invoice_number', event.target.value)} placeholder="INV-2026-001" />}</Field>
            <Field label="Status" error={errors.status} required>{(props) => <SearchableSelect {...selectProps(props)} options={statusOptions} value={data.status} onChange={(value) => setData('status', value as typeof data.status)} />}</Field>
            <Field label="Amount" error={errors.amount} required>{(props) => <Input {...props} className="num" type="number" min="0" step="0.01" value={data.amount} onChange={(event) => setData('amount', event.target.value)} />}</Field>
            <Field label="Currency" error={errors.currency} required>{(props) => <SearchableSelect {...selectProps(props)} options={currencies.map((currency) => ({ value: currency, label: currency }))} value={data.currency} onChange={(value) => setData('currency', value)} />}</Field>
            <Field label="Payment method" error={errors.method}>{(props) => <SearchableSelect {...selectProps(props)} options={methodOptions} value={data.method} onChange={(value) => setData('method', value)} />}</Field>
            <Field label="Due on" error={errors.due_at}>{(props) => <Input {...props} type="date" value={data.due_at} onChange={(event) => setData('due_at', event.target.value)} />}</Field>
            <Field label="Paid on" error={errors.paid_at}>{(props) => <Input {...props} type="date" value={data.paid_at} onChange={(event) => setData('paid_at', event.target.value)} />}</Field>
            <Field label="Reference" error={errors.reference}>{(props) => <Input {...props} value={data.reference} onChange={(event) => setData('reference', event.target.value)} placeholder="Transaction reference" />}</Field>
        </CardBody></Card>
        <Card><CardHeader title="Notes" /><CardBody><Field label="Payment notes" error={errors.notes}>{(props) => <Textarea {...props} rows={4} value={data.notes} onChange={(event) => setData('notes', event.target.value)} placeholder="Internal payment notes" />}</Field></CardBody><CardFooter><Link href={payment ? `/payments/${payment.id}` : '/payments'}><Button variant="secondary">Cancel</Button></Link><Button type="submit" disabled={processing}>{processing && <LoaderCircle className="animate-spin" />}{submitLabel}</Button></CardFooter></Card>
    </form>;
}
