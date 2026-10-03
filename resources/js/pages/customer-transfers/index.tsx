import { Head, Link, router } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import AppLayout from '@/layouts/app-layout';

type Tenant = {
    id: string;
    business_name: string;
    customer_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    url: string | null;
    database: string | null;
    crm_application_instance_id: number | null;
    local_instance_id: number | null;
    local_customer_id: number | null;
};

export default function CustomerTransfersIndex({ tenants, meta, filters, error, canTransfer }: {
    tenants: Tenant[];
    meta: { current_page: number; last_page: number; total: number };
    filters: { search: string };
    error: string | null;
    canTransfer: boolean;
}) {
    const [search, setSearch] = useState(filters.search);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        router.get('/customer-transfers', { search }, { preserveState: true });
    };
    const page = (number: number) => router.get('/customer-transfers', { search: filters.search, page: number }, { preserveState: true });

    return <AppLayout>
        <Head title="Customer transfer" />
        <PageHeader title="Customer transfer" description="Review existing CounterPOS tenants and transfer them to CRM one at a time. Hosting health is not checked here." />
        <Card className="overflow-hidden">
            <form onSubmit={submit} className="flex flex-wrap items-center gap-2 border-b border-line p-3">
                <Input aria-label="Search CounterPOS tenants" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search customer, business, email, or domain" className="max-w-md" />
                <Button type="submit" variant="secondary">Search</Button>
                <span className="ml-auto text-xs text-ink-3">{meta.total} tenants</span>
            </form>
            {error && <p className="m-3 rounded-md bg-bad-wash p-3 text-xs text-bad">{error}</p>}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead className="bg-surface-2 text-ink-3"><tr>
                        <th className="px-3 py-2">Customer / business</th><th className="px-3 py-2">URL</th><th className="px-3 py-2">Database</th><th className="px-3 py-2">CounterPOS status</th><th className="px-3 py-2">CRM</th><th className="px-3 py-2 text-right">Action</th>
                    </tr></thead>
                    <tbody className="divide-y divide-line">
                        {tenants.map((tenant) => <tr key={tenant.id}>
                            <td className="px-3 py-3"><div className="font-semibold text-ink">{tenant.customer_name || 'No contact name'}</div><div className="text-ink-3">{tenant.business_name}</div>{tenant.email && <div className="text-ink-3">{tenant.email}</div>}</td>
                            <td className="px-3 py-3">{tenant.url ? <a href={tenant.url} target="_blank" rel="noreferrer" className="text-brand hover:underline">{tenant.url}</a> : '—'}</td>
                            <td className="px-3 py-3 font-mono text-2xs">{tenant.database || '—'}</td>
                            <td className="px-3 py-3 capitalize">{tenant.status}</td>
                            <td className="px-3 py-3">{tenant.local_customer_id ? <Link href={`/customers/${tenant.local_customer_id}`} className="text-brand hover:underline">Customer #{tenant.local_customer_id}</Link> : tenant.crm_application_instance_id ? `Linked to instance #${tenant.crm_application_instance_id}` : 'Not transferred'}</td>
                            <td className="px-3 py-3 text-right">{tenant.local_instance_id && !tenant.crm_application_instance_id ? <Button size="sm" variant="secondary" onClick={() => router.post(`/customer-transfers/${tenant.local_instance_id}/retry-link`)}>Retry link</Button> : !tenant.local_instance_id && !tenant.crm_application_instance_id && canTransfer ? <Link href={`/customer-transfers/${tenant.id}/create`} className="inline-flex h-8 items-center rounded-md bg-brand px-3 text-2xs font-medium text-brand-ink">Transfer</Link> : '—'}</td>
                        </tr>)}
                        {tenants.length === 0 && !error && <tr><td colSpan={6} className="px-3 py-8 text-center text-ink-3">No CounterPOS tenants found.</td></tr>}
                    </tbody>
                </table>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-line p-3">
                <Button variant="secondary" size="sm" disabled={meta.current_page <= 1} onClick={() => page(meta.current_page - 1)}>Previous</Button>
                <span className="text-xs text-ink-3">Page {meta.current_page} of {meta.last_page}</span>
                <Button variant="secondary" size="sm" disabled={meta.current_page >= meta.last_page} onClick={() => page(meta.current_page + 1)}>Next</Button>
            </div>
        </Card>
    </AppLayout>;
}
