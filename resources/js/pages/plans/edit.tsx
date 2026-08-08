import { Head, router } from '@inertiajs/react';
import { ArrowLeft, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { PlanForm } from '@/components/plans/plan-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import AppLayout from '@/layouts/app-layout';
import type { BillingCycleOption, Plan } from '@/types';

interface Props {
    plan: Plan;
    product: { id: number; name: string; code: string; default_trial_days: number | null };
    billingCycles: BillingCycleOption[];
    currencies: string[];
}

export default function PlanEdit({ plan, product, billingCycles, currencies }: Props) {
    const [archiveOpen, setArchiveOpen] = useState(false);

    return (
        <AppLayout>
            <Head title={`Edit ${plan.name}`} />

            <PageHeader
                title={plan.name}
                actions={
                    <>
                        <Button variant="secondary" onClick={() => router.visit(`/products/${product.id}`)}><ArrowLeft /> Back to Product</Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Archive plan"
                            onClick={() => setArchiveOpen(true)}
                        >
                            <Trash2 />
                        </Button>
                    </>
                }
            />

            <div className="w-full">
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

            <Modal
                open={archiveOpen}
                onClose={() => setArchiveOpen(false)}
                title="Archive plan"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setArchiveOpen(false)}>Cancel</Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                setArchiveOpen(false);
                                router.delete(`/plans/${plan.id}`);
                            }}
                        >
                            Archive plan
                        </Button>
                    </>
                }
            >
                <div className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warn-wash text-warn">
                        <TriangleAlert className="size-4" />
                    </span>
                    <div>
                        <p className="text-xs font-medium text-ink">Archive {plan.name}?</p>
                        <p className="mt-1 text-2xs leading-5 text-ink-2">The plan will no longer be available for new subscriptions.</p>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
