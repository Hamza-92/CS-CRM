import { Head, router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { PlanForm } from '@/components/plans/plan-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BillingCycleOption, Plan } from '@/types';

interface Props {
    plan: Plan;
    product: { id: number; name: string; code: string; default_trial_days: number | null };
    billingCycles: BillingCycleOption[];
    currencies: string[];
}

export default function PlanEdit({ plan, product, billingCycles, currencies }: Props) {
    return (
        <AppLayout>
            <Head title={`Edit ${plan.name}`} />

            <PageHeader
                title={plan.name}
                breadcrumbs={[
                    { label: 'Products', href: '/products' },
                    { label: product.name, href: `/products/${product.id}` },
                    { label: plan.name },
                ]}
                actions={
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Archive plan"
                        onClick={() => {
                            if (confirm(`Archive ${plan.name}?`)) {
                                router.delete(`/plans/${plan.id}`);
                            }
                        }}
                    >
                        <Trash2 />
                    </Button>
                }
            />

            <div className="max-w-3xl">
                <PlanForm
                    plan={plan}
                    productId={product.id}
                    billingCycles={billingCycles}
                    currencies={currencies}
                    action={`/plans/${plan.id}`}
                    method="put"
                    submitLabel="Save changes"
                />
            </div>
        </AppLayout>
    );
}
