import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Building2, Check, ChevronDown, CircleDollarSign, ContactRound, LoaderCircle, PackageCheck, Plus, ReceiptText, Server, Trash2, type LucideIcon } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { UserRef } from '@/types';

type Plan = { id: number; product_id: number; name: string; code: string; billing_cycle: string; duration_days: number | null; price: string; currency: string; grace_days: number };
type Product = { id: number; name: string; code: string; brand_color: string | null; default_trial_days: number | null; plans: Plan[] };
type Contact = { name: string; job_title: string; email: string; phone: string; whatsapp: string; is_primary: boolean; notes: string };
type Data = {
    name: string; business: string; phone: string; whatsapp: string; email: string; city: string; source: string; status: string; owner_id: string; tags: string; notes: string;
    contacts: Contact[];
    application: { enabled: boolean; product_id: string; name: string; environment: string; status: string; domain: string; server_name: string; version: string; provisioning_template_code: string; notes: string };
    subscription: { enabled: boolean; plan_id: string; kind: string; status: string; starts_at: string; ends_at: string; renewal_at: string; grace_ends_at: string; auto_renew: boolean; external_reference: string; notes: string };
    payment: { enabled: boolean; invoice_number: string; amount: string; currency: string; status: string; method: string; due_at: string; paid_at: string; reference: string; notes: string };
};
const emptyContact = (): Contact => ({ name: '', job_title: '', email: '', phone: '', whatsapp: '', is_primary: false, notes: '' });
const label = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const options = (values: string[]) => values.map((value) => ({ value, label: label(value) }));
const selectProps = (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ({ id: props.id, invalid: props['aria-invalid'], describedBy: props['aria-describedby'] });
function addDays(date: string, days: number) { if (!date) return ''; const value = new Date(`${date}T12:00:00`); value.setDate(value.getDate() + days); return value.toISOString().slice(0, 10); }

function Section({ title, description, icon: Icon, defaultOpen = false, action, complete, children }: { title: string; description: string; icon: LucideIcon; defaultOpen?: boolean; action?: ReactNode; complete?: boolean; children: ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return <Card>
        <div className={cn('flex items-center gap-2 px-3.5', open && 'border-b border-line')}>
            <button type="button" className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
                <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', complete ? 'bg-ok-wash text-ok' : 'bg-brand-wash text-brand')}>{complete ? <Check className="size-4" /> : <Icon className="size-4" />}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-ink">{title}</span><span className="mt-0.5 hidden truncate text-2xs text-ink-3 sm:block">{description}</span></span>
            </button>
            {action && <div className="shrink-0">{action}</div>}
            <button type="button" className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-3 hover:bg-surface-2" onClick={() => setOpen(!open)} aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}><ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} /></button>
        </div>
        {open && <div className="p-3.5 sm:p-4">{children}</div>}
    </Card>;
}
function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
    return <label className={cn('flex items-center gap-2 rounded-md border border-line px-2.5 py-1.5 text-2xs font-medium text-ink-2', disabled && 'opacity-50')}><input type="checkbox" className="size-3.5 accent-brand" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} /><span className="hidden sm:inline">Include</span></label>;
}
function Summary({ label: title, value, done }: { label: string; value: string; done: boolean }) {
    return <div className="flex gap-2"><span className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full', done ? 'bg-ok-wash text-ok' : 'bg-surface-3 text-ink-3')}>{done && <Check className="size-3" />}</span><div className="min-w-0"><div className="text-2xs uppercase tracking-wide text-ink-3">{title}</div><div className="truncate text-xs font-medium text-ink">{value}</div></div></div>;
}

export default function CustomerCreate({ owners, products, currencies, defaultCurrency, defaults, can }: { owners: UserRef[]; products: Product[]; currencies: string[]; defaultCurrency: string; defaults: { starts_at: string; invoice_number: string }; can: { create_instance: boolean; create_subscription: boolean; create_payment: boolean } }) {
    const { data, setData, post, transform, processing, errors } = useForm<Data>({
        name: '', business: '', phone: '', whatsapp: '', email: '', city: '', source: '', status: 'active', owner_id: '', tags: '', notes: '', contacts: [],
        application: { enabled: can.create_instance, product_id: '', name: '', environment: 'production', status: 'planned', domain: '', server_name: '', version: '', provisioning_template_code: '', notes: '' },
        subscription: { enabled: can.create_instance && can.create_subscription, plan_id: '', kind: 'subscription', status: 'active', starts_at: defaults.starts_at, ends_at: '', renewal_at: '', grace_ends_at: '', auto_renew: true, external_reference: '', notes: '' },
        payment: { enabled: false, invoice_number: defaults.invoice_number, amount: '', currency: defaultCurrency, status: 'pending', method: '', due_at: defaults.starts_at, paid_at: '', reference: '', notes: '' },
    });
    const e = errors as Record<string, string>;
    const product = products.find((item) => String(item.id) === data.application.product_id);
    const plans = product?.plans ?? [];
    const plan = plans.find((item) => String(item.id) === data.subscription.plan_id);
    const app = (patch: Partial<Data['application']>) => setData('application', { ...data.application, ...patch });
    const sub = (patch: Partial<Data['subscription']>) => setData('subscription', { ...data.subscription, ...patch });
    const pay = (patch: Partial<Data['payment']>) => setData('payment', { ...data.payment, ...patch });
    const ownerOptions = [{ value: '', label: 'Assign automatically' }, ...owners.map((owner) => ({ value: String(owner.id), label: owner.name, hint: owner.email }))];

    function choosePlan(id: string, list = plans) {
        const selected = list.find((item) => String(item.id) === id);
        if (!selected) return sub({ plan_id: '' });
        const duration = selected.duration_days ?? ({ trial: 14, monthly: 30, quarterly: 90, semi_annual: 182, annual: 365 }[selected.billing_cycle] ?? 0);
        const ends = duration ? addDays(data.subscription.starts_at, duration) : '';
        const renews = !['trial', 'lifetime'].includes(selected.billing_cycle);
        sub({ plan_id: id, kind: selected.billing_cycle === 'trial' ? 'trial' : 'subscription', status: selected.billing_cycle === 'trial' ? 'trialing' : 'active', ends_at: ends, renewal_at: renews ? ends : '', grace_ends_at: ends ? addDays(ends, selected.grace_days) : '', auto_renew: renews });
        pay({ amount: selected.price, currency: selected.currency });
    }
    function chooseProduct(id: string) {
        const selected = products.find((item) => String(item.id) === id);
        app({ product_id: id, provisioning_template_code: selected?.code.toLowerCase().replace(/[^a-z0-9_-]/g, '_') ?? '' });
        choosePlan(selected?.plans[0] ? String(selected.plans[0].id) : '', selected?.plans ?? []);
    }
    function toggleApp(enabled: boolean) { app({ enabled }); if (!enabled) { sub({ enabled: false }); pay({ enabled: false }); } }
    function toggleSub(enabled: boolean) { sub({ enabled }); if (enabled && !data.application.enabled) app({ enabled: true }); if (!enabled) pay({ enabled: false }); }
    function togglePay(enabled: boolean) { pay({ enabled }); if (enabled) { if (!data.application.enabled) app({ enabled: true }); if (!data.subscription.enabled) sub({ enabled: true }); } }
    function contact(index: number, patch: Partial<Contact>) { setData('contacts', data.contacts.map((item, current) => current === index ? { ...item, ...patch } : item)); }
    function primary(index: number) { setData('contacts', data.contacts.map((item, current) => ({ ...item, is_primary: current === index }))); }
    function submit(event: FormEvent) { event.preventDefault(); transform((values) => ({ ...values, tags: values.tags.split(',').map((tag) => tag.trim()).filter(Boolean), contacts: values.contacts.filter((item) => item.name.trim()) })); post('/customers'); }

    return <AppLayout><Head title="New customer" />
        <PageHeader title="New customer" description="Create the customer, application, subscription, and opening payment in one place." actions={<Link href="/customers"><Button variant="secondary"><ArrowLeft /> Customers</Button></Link>} />
        <form onSubmit={submit} noValidate><div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_290px]"><div className="space-y-4">
            <Section title="Customer" description="Identity, communication, ownership, and internal context" icon={Building2} defaultOpen complete={Boolean(data.name.trim())}>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Contact name" error={e.name} required className="lg:col-span-2">{(p) => <Input {...p} value={data.name} onChange={(x) => setData('name', x.target.value)} placeholder="Primary customer name" />}</Field>
                    <Field label="Business" error={e.business} className="lg:col-span-2">{(p) => <Input {...p} value={data.business} onChange={(x) => setData('business', x.target.value)} placeholder="Store or company name" />}</Field>
                    <Field label="Phone" error={e.phone}>{(p) => <Input {...p} value={data.phone} onChange={(x) => setData('phone', x.target.value)} />}</Field>
                    <Field label="WhatsApp" error={e.whatsapp}>{(p) => <Input {...p} value={data.whatsapp} onChange={(x) => setData('whatsapp', x.target.value)} placeholder="Uses phone if empty" />}</Field>
                    <Field label="Email" error={e.email}>{(p) => <Input {...p} type="email" value={data.email} onChange={(x) => setData('email', x.target.value)} />}</Field>
                    <Field label="City" error={e.city}>{(p) => <Input {...p} value={data.city} onChange={(x) => setData('city', x.target.value)} />}</Field>
                    <Field label="Owner" error={e.owner_id} className="lg:col-span-2">{(p) => <SearchableSelect {...selectProps(p)} options={ownerOptions} value={data.owner_id} onChange={(value) => setData('owner_id', value)} />}</Field>
                    <Field label="Source" error={e.source}>{(p) => <SearchableSelect {...selectProps(p)} options={[{ value: '', label: 'Not specified' }, ...options(['website', 'referral', 'campaign', 'outbound', 'walk_in', 'partner', 'other'])]} value={data.source} onChange={(value) => setData('source', value)} />}</Field>
                    <Field label="Status" error={e.status}>{(p) => <SearchableSelect {...selectProps(p)} options={options(['active', 'inactive'])} value={data.status} onChange={(value) => setData('status', value)} />}</Field>
                </div>
                <details className="mt-4 rounded-lg border border-line bg-surface-2"><summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-ink">Notes and tags</summary><div className="grid gap-4 border-t border-line p-3 sm:grid-cols-2">
                    <Field label="Tags" error={e.tags} hint="Separate with commas.">{(p) => <Input {...p} value={data.tags} onChange={(x) => setData('tags', x.target.value)} />}</Field>
                    <Field label="Notes" error={e.notes}>{(p) => <Textarea {...p} rows={3} value={data.notes} onChange={(x) => setData('notes', x.target.value)} />}</Field>
                </div></details>
            </Section>

            <Section title="Contacts" description="Decision makers, billing contacts, and technical contacts" icon={ContactRound} complete={data.contacts.length > 0 && data.contacts.every((item) => Boolean(item.name.trim()))} action={<Button type="button" variant="secondary" size="sm" onClick={() => setData('contacts', [...data.contacts, emptyContact()])}><Plus /> <span className="hidden sm:inline">Add</span></Button>}>
                {data.contacts.length === 0 ? <div className="rounded-lg border border-dashed border-line p-5 text-center text-xs text-ink-3">The customer above will be used as the primary contact.</div> : <div className="space-y-3">{data.contacts.map((item, index) =>
                    <div key={index} className="rounded-lg border border-line bg-surface-2 p-3"><div className="mb-3 flex items-center justify-between"><div className="flex gap-2 text-xs font-semibold text-ink">Contact {index + 1}{item.is_primary && <Badge tone="brand" size="sm">Primary</Badge>}</div><button type="button" onClick={() => setData('contacts', data.contacts.filter((_, i) => i !== index))} className="rounded p-1.5 text-ink-3 hover:bg-bad-wash hover:text-bad"><Trash2 className="size-4" /></button></div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <Field label="Name" error={e[`contacts.${index}.name`]} required className="lg:col-span-2">{(p) => <Input {...p} value={item.name} onChange={(x) => contact(index, { name: x.target.value })} />}</Field>
                        <Field label="Job title" error={e[`contacts.${index}.job_title`]} className="lg:col-span-2">{(p) => <Input {...p} value={item.job_title} onChange={(x) => contact(index, { job_title: x.target.value })} />}</Field>
                        <Field label="Email" error={e[`contacts.${index}.email`]}>{(p) => <Input {...p} type="email" value={item.email} onChange={(x) => contact(index, { email: x.target.value })} />}</Field>
                        <Field label="Phone" error={e[`contacts.${index}.phone`]}>{(p) => <Input {...p} value={item.phone} onChange={(x) => contact(index, { phone: x.target.value })} />}</Field>
                        <Field label="WhatsApp" error={e[`contacts.${index}.whatsapp`]}>{(p) => <Input {...p} value={item.whatsapp} onChange={(x) => contact(index, { whatsapp: x.target.value })} />}</Field>
                        <label className="flex items-end gap-2 pb-2 text-xs text-ink-2"><input type="radio" name="primary_contact" checked={item.is_primary} onChange={() => primary(index)} className="size-4 accent-brand" /> Primary</label>
                    </div></div>)}</div>}
            </Section>

            <Section title="Application and domain" description="Product choice and CounterPOS tenant identity" icon={Server} defaultOpen complete={!data.application.enabled || Boolean(data.application.product_id)} action={<Toggle checked={data.application.enabled} disabled={!can.create_instance} onChange={toggleApp} />}>
                {!data.application.enabled ? <p className="text-xs text-ink-3">The customer will be saved without an application.</p> : <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Product" error={e['application.product_id']} required className="lg:col-span-2">{(p) => <SearchableSelect {...selectProps(p)} options={products.map((item) => ({ value: String(item.id), label: item.name, hint: item.code }))} value={data.application.product_id} onChange={chooseProduct} placeholder="Select product" />}</Field>
                    <Field label="Environment" error={e['application.environment']}>{(p) => <SearchableSelect {...selectProps(p)} options={options(['production', 'demo', 'staging', 'sandbox'])} value={data.application.environment} onChange={(value) => app({ environment: value })} />}</Field>
                    <Field label="Status" error={e['application.status']}>{(p) => <SearchableSelect {...selectProps(p)} options={options(['planned', 'active', 'paused'])} value={data.application.status} onChange={(value) => app({ status: value })} />}</Field>
                    <Field label="Application name" error={e['application.name']} className="lg:col-span-2" hint="Generated when left empty.">{(p) => <Input {...p} value={data.application.name} onChange={(x) => app({ name: x.target.value })} placeholder={data.business ? `${data.business} CounterPOS` : 'Generated automatically'} />}</Field>
                    <Field label="Domain" error={e['application.domain']} className="lg:col-span-2" hint="Used by hosting automation later.">{(p) => <Input {...p} value={data.application.domain} onChange={(x) => app({ domain: x.target.value.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '') })} placeholder="shop.counterpos.pk" />}</Field>
                    <Field label="Starter data template" error={e['application.provisioning_template_code']} className="lg:col-span-2">{(p) => <Input {...p} value={data.application.provisioning_template_code} onChange={(x) => app({ provisioning_template_code: x.target.value.toLowerCase() })} placeholder="grocery" />}</Field>
                </div><details className="mt-4 rounded-lg border border-line bg-surface-2"><summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-ink">Technical details</summary><div className="grid gap-4 border-t border-line p-3 sm:grid-cols-3">
                    <Field label="Server" error={e['application.server_name']}>{(p) => <Input {...p} value={data.application.server_name} onChange={(x) => app({ server_name: x.target.value })} />}</Field>
                    <Field label="Version" error={e['application.version']}>{(p) => <Input {...p} value={data.application.version} onChange={(x) => app({ version: x.target.value })} />}</Field>
                    <Field label="Notes" error={e['application.notes']}>{(p) => <Textarea {...p} rows={2} value={data.application.notes} onChange={(x) => app({ notes: x.target.value })} />}</Field>
                </div></details></>}
            </Section>

            <Section title="Subscription" description="Plan, lifecycle dates, and renewal settings" icon={ReceiptText} defaultOpen complete={!data.subscription.enabled || Boolean(data.subscription.plan_id)} action={<Toggle checked={data.subscription.enabled} disabled={!can.create_subscription || !data.application.enabled} onChange={toggleSub} />}>
                {!data.subscription.enabled ? <p className="text-xs text-ink-3">Subscription can be added later.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Plan" error={e['subscription.plan_id']} required className="lg:col-span-2">{(p) => <SearchableSelect {...selectProps(p)} options={plans.map((item) => ({ value: String(item.id), label: item.name, hint: `${item.currency} ${Number(item.price).toLocaleString()} � ${label(item.billing_cycle)}` }))} value={data.subscription.plan_id} onChange={choosePlan} placeholder={product ? 'Select plan' : 'Choose product first'} disabled={!product} />}</Field>
                    <Field label="Status" error={e['subscription.status']}>{(p) => <SearchableSelect {...selectProps(p)} options={options(['trialing', 'active', 'past_due', 'paused'])} value={data.subscription.status} onChange={(value) => sub({ status: value })} />}</Field>
                    <Field label="Starts" error={e['subscription.starts_at']}>{(p) => <Input {...p} type="date" value={data.subscription.starts_at} onChange={(x) => sub({ starts_at: x.target.value })} />}</Field>
                    <Field label="Ends" error={e['subscription.ends_at']}>{(p) => <Input {...p} type="date" value={data.subscription.ends_at} onChange={(x) => sub({ ends_at: x.target.value })} />}</Field>
                    <Field label="Renewal" error={e['subscription.renewal_at']}>{(p) => <Input {...p} type="date" value={data.subscription.renewal_at} onChange={(x) => sub({ renewal_at: x.target.value })} />}</Field>
                    <Field label="Grace ends" error={e['subscription.grace_ends_at']}>{(p) => <Input {...p} type="date" value={data.subscription.grace_ends_at} onChange={(x) => sub({ grace_ends_at: x.target.value })} />}</Field>
                    <Field label="Reference" error={e['subscription.external_reference']}>{(p) => <Input {...p} value={data.subscription.external_reference} onChange={(x) => sub({ external_reference: x.target.value })} />}</Field>
                    <label className="flex items-end gap-2 pb-2 text-xs text-ink-2"><input type="checkbox" checked={data.subscription.auto_renew} onChange={(x) => sub({ auto_renew: x.target.checked })} className="size-4 accent-brand" /> Auto renew</label>
                </div>}
            </Section>

            <Section title="First payment" description="Opening invoice or received payment" icon={CircleDollarSign} complete={!data.payment.enabled || Boolean(data.payment.invoice_number && data.payment.amount)} action={<Toggle checked={data.payment.enabled} disabled={!can.create_payment || !data.subscription.enabled} onChange={togglePay} />}>
                {!data.payment.enabled ? <p className="text-xs text-ink-3">Payment can be recorded later.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Invoice" error={e['payment.invoice_number']} required className="lg:col-span-2">{(p) => <Input {...p} value={data.payment.invoice_number} onChange={(x) => pay({ invoice_number: x.target.value })} />}</Field>
                    <Field label="Amount" error={e['payment.amount']} required>{(p) => <Input {...p} type="number" min="0" step="0.01" value={data.payment.amount} onChange={(x) => pay({ amount: x.target.value })} />}</Field>
                    <Field label="Currency" error={e['payment.currency']}>{(p) => <SearchableSelect {...selectProps(p)} options={currencies.map((value) => ({ value, label: value }))} value={data.payment.currency} onChange={(value) => pay({ currency: value })} />}</Field>
                    <Field label="Status" error={e['payment.status']}>{(p) => <SearchableSelect {...selectProps(p)} options={options(['pending', 'partially_paid', 'paid'])} value={data.payment.status} onChange={(value) => pay({ status: value })} />}</Field>
                    <Field label="Method" error={e['payment.method']}>{(p) => <SearchableSelect {...selectProps(p)} options={[{ value: '', label: 'Not specified' }, ...options(['bank_transfer', 'card', 'cash', 'online', 'other'])]} value={data.payment.method} onChange={(value) => pay({ method: value })} />}</Field>
                    <Field label="Due" error={e['payment.due_at']}>{(p) => <Input {...p} type="date" value={data.payment.due_at} onChange={(x) => pay({ due_at: x.target.value })} />}</Field>
                    {data.payment.status === 'paid' && <Field label="Paid" error={e['payment.paid_at']}>{(p) => <Input {...p} type="date" value={data.payment.paid_at} onChange={(x) => pay({ paid_at: x.target.value })} />}</Field>}
                    <Field label="Reference" error={e['payment.reference']} className="lg:col-span-2">{(p) => <Input {...p} value={data.payment.reference} onChange={(x) => pay({ reference: x.target.value })} />}</Field>
                </div>}
            </Section>
        </div>
        <div className="xl:sticky xl:top-4"><Card><CardBody><div className="flex items-center gap-2"><PackageCheck className="size-4 text-brand" /><h2 className="text-sm font-semibold text-ink">Onboarding summary</h2></div><div className="mt-4 space-y-3">
            <Summary label="Customer" value={data.business || data.name || 'Not entered'} done={Boolean(data.name)} />
            <Summary label="Contacts" value={data.contacts.length ? String(data.contacts.length) : 'Primary only'} done />
            <Summary label="Product" value={data.application.enabled ? (product?.name || 'Select product') : 'Skipped'} done={!data.application.enabled || Boolean(product)} />
            <Summary label="Plan" value={data.subscription.enabled ? (plan?.name || 'Select plan') : 'Skipped'} done={!data.subscription.enabled || Boolean(plan)} />
            <Summary label="Payment" value={data.payment.enabled ? `${data.payment.currency} ${data.payment.amount || '0'}` : 'Later'} done={!data.payment.enabled || Boolean(data.payment.amount)} />
            <Summary label="Domain" value={data.application.domain || 'Add later'} done={!data.application.enabled || Boolean(data.application.domain)} />
        </div><div className="mt-4 rounded-lg border border-info-line bg-info-wash p-3 text-2xs leading-relaxed text-info">This saves CRM records together. Hosting, database, migrations, and CounterPOS activation remain reviewed actions from the customer workspace.</div></CardBody>
        <CardFooter className="flex-col gap-2"><Button type="submit" className="w-full" disabled={processing}>{processing ? <LoaderCircle className="animate-spin" /> : <Check />} Create customer workspace</Button><Link href="/customers" className="w-full"><Button type="button" variant="secondary" className="w-full">Cancel</Button></Link></CardFooter></Card></div>
        </div></form>
    </AppLayout>;
}
