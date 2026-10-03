import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input, Select } from '@/components/ui/field';
import AppLayout from '@/layouts/app-layout';

type Tenant = { id: string; business_name: string; customer_name: string | null; email: string | null; phone: string | null; status: string; url: string | null; database: string | null };
type Plan = { id: number; name: string; code: string; billing_cycle: string; duration_days: number | null; price: string; currency: string };
type Product = { id: number; name: string; code: string; plans: Plan[] };
type ExistingCustomer = { id: number; name: string; business: string | null; email: string | null; status: string };
type TransferForm = {
    tenant_id: string; existing_customer_id: string; name: string; business: string; email: string; phone: string; customer_status: string;
    product_id: string; instance_name: string; environment: string; instance_status: string;
    plan_id: string; subscription_status: string; starts_at: string; ends_at: string; auto_renew: boolean; dates_confirmed: boolean;
};

export default function CustomerTransferCreate({ tenant, products, existingCustomers }: { tenant: Tenant; products: Product[]; existingCustomers: ExistingCustomer[] }) {
    const initialProduct = products[0];
    const form = useForm<TransferForm>({
        tenant_id: tenant.id,
        existing_customer_id: '',
        name: tenant.customer_name || tenant.business_name,
        business: tenant.business_name,
        email: tenant.email || '',
        phone: tenant.phone || '',
        customer_status: tenant.status === 'active' ? 'active' : 'inactive',
        product_id: initialProduct ? String(initialProduct.id) : '',
        instance_name: tenant.business_name + ' CounterPOS',
        environment: 'production',
        instance_status: tenant.status === 'active' ? 'active' : tenant.status === 'suspended' ? 'paused' : tenant.status === 'archived' ? 'retired' : 'planned',
        plan_id: '',
        subscription_status: 'active',
        starts_at: '',
        ends_at: '',
        auto_renew: false,
        dates_confirmed: false,
    });
    const selectedProduct = products.find((product) => String(product.id) === form.data.product_id);
    const selectedPlan = selectedProduct?.plans.find((plan) => String(plan.id) === form.data.plan_id);
    const existingCustomer = existingCustomers.find((customer) => String(customer.id) === form.data.existing_customer_id);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/customer-transfers');
    };

    return <AppLayout>
        <Head title={`Transfer ${tenant.business_name}`} />
        <PageHeader title="Transfer CounterPOS customer" description="Review the customer and choose the CRM subscription dates. This links the existing tenant; it does not provision a new one." actions={<Link href="/customer-transfers" className="text-xs text-brand hover:underline">Back to tenant list</Link>} />
        <form onSubmit={submit} className="space-y-4">
            <Card><CardBody className="space-y-3">
                <h2 className="text-sm font-semibold text-ink">Existing CounterPOS tenant</h2>
                <div className="grid gap-2 text-xs sm:grid-cols-2"><p><span className="text-ink-3">Business:</span> {tenant.business_name}</p><p><span className="text-ink-3">Status:</span> {tenant.status}</p><p><span className="text-ink-3">URL:</span> {tenant.url || 'None recorded'}</p><p><span className="text-ink-3">Database:</span> {tenant.database || 'None recorded'}</p></div>
                <p className="text-2xs text-ink-3">These values come from CounterPOS. Check the tenant yourself before transfer; this form does not run a hosting health check.</p>
            </CardBody></Card>
            <Card><CardBody className="space-y-4">
                <h2 className="text-sm font-semibold text-ink">CRM customer</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Use an existing CRM customer" error={form.errors.existing_customer_id} hint="Leave blank to create a new customer. If selected, the reviewed contact details below update that CRM customer; its status stays unchanged." className="sm:col-span-2">{(props) => <Select {...props} value={form.data.existing_customer_id} onChange={(event) => { const customer = existingCustomers.find((item) => String(item.id) === event.target.value); form.setData('existing_customer_id', event.target.value); if (customer) form.setData('customer_status', customer.status); }}><option value="">Create a new customer</option>{existingCustomers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.business || 'No business'}{customer.email ? ` · ${customer.email}` : ''}</option>)}</Select>}</Field>
                    <Field label="Customer name" required error={form.errors.name}>{(props) => <Input {...props} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} />}</Field>
                    <Field label="Business name" required error={form.errors.business}>{(props) => <Input {...props} value={form.data.business} onChange={(event) => form.setData('business', event.target.value)} />}</Field>
                    <Field label="Email" error={form.errors.email}>{(props) => <Input {...props} type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} />}</Field>
                    <Field label="Phone" error={form.errors.phone}>{(props) => <Input {...props} value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} />}</Field>
                    <Field label="Customer status" required error={form.errors.customer_status}>{(props) => <Select {...props} value={form.data.customer_status} disabled={Boolean(existingCustomer)} onChange={(event) => form.setData('customer_status', event.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option></Select>}</Field>
                </div>
            </CardBody></Card>
            <Card><CardBody className="space-y-4">
                <h2 className="text-sm font-semibold text-ink">Application</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Product" required error={form.errors.product_id}>{(props) => <Select {...props} value={form.data.product_id} onChange={(event) => { form.setData('product_id', event.target.value); form.setData('plan_id', ''); }}><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</Select>}</Field>
                    <Field label="Application name" required error={form.errors.instance_name}>{(props) => <Input {...props} value={form.data.instance_name} onChange={(event) => form.setData('instance_name', event.target.value)} />}</Field>
                    <Field label="Environment" required error={form.errors.environment}>{(props) => <Select {...props} value={form.data.environment} onChange={(event) => form.setData('environment', event.target.value)}><option value="production">Production</option><option value="demo">Demo</option><option value="staging">Staging</option><option value="sandbox">Sandbox</option></Select>}</Field>
                    <Field label="Application status" required error={form.errors.instance_status}>{(props) => <Select {...props} value={form.data.instance_status} onChange={(event) => form.setData('instance_status', event.target.value)}><option value="active">Active</option><option value="planned">Planned</option><option value="paused">Paused</option><option value="retired">Retired</option></Select>}</Field>
                </div>
            </CardBody></Card>
            <Card><CardBody className="space-y-4">
                <h2 className="text-sm font-semibold text-ink">Subscription</h2>
                <p className="text-xs text-ink-3">CounterPOS's old subscription dates are not copied. Enter the agreed start and end dates from your records.</p>
                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="CRM plan" required error={form.errors.plan_id}>{(props) => <Select {...props} value={form.data.plan_id} onChange={(event) => { const plan = selectedProduct?.plans.find((item) => String(item.id) === event.target.value); form.setData('plan_id', event.target.value); form.setData('subscription_status', plan?.billing_cycle === 'trial' ? 'trialing' : 'active'); }}><option value="">Choose plan</option>{selectedProduct?.plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} ({plan.billing_cycle})</option>)}</Select>}</Field>
                    <Field label="Subscription status" required error={form.errors.subscription_status}>{(props) => <Select {...props} value={form.data.subscription_status} onChange={(event) => form.setData('subscription_status', event.target.value)}><option value="trialing">Trialing</option><option value="active">Active</option><option value="past_due">Past due</option><option value="paused">Paused</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></Select>}</Field>
                    <Field label="Starts on" required error={form.errors.starts_at}>{(props) => <Input {...props} type="date" value={form.data.starts_at} onChange={(event) => { form.setData('starts_at', event.target.value); form.setData('dates_confirmed', false); }} />}</Field>
                    <Field label="Ends on" required error={form.errors.ends_at}>{(props) => <Input {...props} type="date" value={form.data.ends_at} onChange={(event) => { form.setData('ends_at', event.target.value); form.setData('dates_confirmed', false); }} />}</Field>
                </div>
                {selectedPlan && <p className="text-2xs text-ink-3">Selected plan: {selectedPlan.name} · {selectedPlan.currency} {selectedPlan.price}</p>}
                <label className="flex items-center gap-2 text-xs text-ink"><input type="checkbox" checked={form.data.auto_renew} onChange={(event) => form.setData('auto_renew', event.target.checked)} /> Auto renew</label>
                <label className="flex items-start gap-2 rounded-md border border-line p-3 text-xs text-ink"><input type="checkbox" className="mt-0.5" checked={form.data.dates_confirmed} onChange={(event) => form.setData('dates_confirmed', event.target.checked)} /> I verified the plan and subscription start and end dates for this customer.</label>
                {form.errors.dates_confirmed && <p className="text-xs text-bad">{form.errors.dates_confirmed}</p>}
            </CardBody></Card>
            <div className="flex justify-end gap-2"><Link href="/customer-transfers" className="inline-flex h-9 items-center rounded-md border border-line-2 px-3 text-xs">Cancel</Link><Button type="submit" disabled={form.processing || !form.data.dates_confirmed}>Transfer customer</Button></div>
        </form>
    </AppLayout>;
}
