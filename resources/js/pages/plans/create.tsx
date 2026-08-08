import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { PlanForm } from '@/components/plans/plan-form';
import AppLayout from '@/layouts/app-layout';
import type { BillingCycleOption } from '@/types';

interface Props {
    product: { id: number; name: string; code: string; default_trial_days: number | null };
    billingCycles: BillingCycleOption[];
    currencies: string[];
    defaults: { currency: string; grace_days: number };
}

export default function PlanCreate({ product, billingCycles, currencies, defaults }: Props) {
    return (
        <AppLayout>
            <Head title={`New plan · ${product.name}`} />

            <PageHeader
                title="New plan"
                breadcrumbs={[
                    { label: 'Products', href: '/products' },
                    { label: product.name, href: `/products/${product.id}` },
                    { label: 'New plan' },
                ]}
            />

            <div className="max-w-3xl">
                <PlanForm
                    productId={product.id}
                    billingCycles={billingCycles}
                    currencies={currencies}
                    defaults={defaults}
                    action={`/products/${product.id}/plans`}
                    method="post"
                    submitLabel="Create plan"
                />
            </div>
        </AppLayout>
    );
}
