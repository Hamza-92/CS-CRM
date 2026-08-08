import { Head, Link, router } from '@inertiajs/react';
import { ArchiveRestore, ArrowLeft, Layers, Pencil, Plus, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import AppLayout from '@/layouts/app-layout';
import type { Activity, Plan, Product } from '@/types';
import { dateTime, money, relativeTime, toneForCycle, toneForEvent } from '@/lib/format';

interface Props {
    product: Product;
    plans: Plan[];
    activities: Activity[];
    can: { update: boolean; delete: boolean; managePlans: boolean; viewPricing: boolean };
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-3 py-1.5">
            <dt className="shrink-0 text-2xs text-ink-3">{label}</dt>
            <dd className="min-w-0 truncate text-right text-xs text-ink">{children}</dd>
        </div>
    );
}

export default function ProductShow({ product, plans, activities, can }: Props) {
    const [archiveOpen, setArchiveOpen] = useState(false);

    return (
        <AppLayout>
            <Head title={product.name} />

            <PageHeader
                title={product.name}
                badge={
                    product.deleted_at ? (
                        <Badge tone="warn" size="sm">
                            Archived
                        </Badge>
                    ) : (
                        <Badge tone={product.is_active ? 'ok' : 'neutral'} size="sm">
                            {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                    )
                }
                actions={
                    <>
                        <Button variant="secondary" onClick={() => router.visit('/products')}>
                            <ArrowLeft />
                            Back to Products
                        </Button>
                        {can.update && !product.deleted_at && (
                            <Link href={`/products/${product.id}/edit`}>
                                <Button variant="secondary">
                                    <Pencil />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {can.delete && !product.deleted_at && (
                            <Button variant="ghost" size="icon" aria-label="Archive product" onClick={() => setArchiveOpen(true)}>
                                <Trash2 />
                            </Button>
                        )}
                        {can.update && product.deleted_at && (
                            <Button onClick={() => router.patch(`/products/${product.id}/restore`)}>
                                <ArchiveRestore />
                                Restore
                            </Button>
                        )}
                    </>
                }
            />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <Card>
                        <CardHeader
                            title="Plans"
                            meta={plans.length > 0 ? `${plans.length}` : undefined}
                            action={
                                can.managePlans && !product.deleted_at && (
                                    <Link href={`/products/${product.id}/plans/create`}>
                                        <Button size="sm" variant="secondary">
                                            <Plus />
                                            Add
                                        </Button>
                                    </Link>
                                )
                            }
                        />
                        {plans.length === 0 ? (
                            <CardBody>
                                <EmptyState
                                    icon={Layers}
                                    title="No plans yet"
                                    description="A product needs a plan before it can be sold or trialled."
                                    action={
                                        can.managePlans && !product.deleted_at && (
                                            <Link href={`/products/${product.id}/plans/create`}>
                                                <Button size="sm">
                                                    <Plus />
                                                    New plan
                                                </Button>
                                            </Link>
                                        )
                                    }
                                />
                            </CardBody>
                        ) : (
                            <table className="w-full border-collapse">
                                <thead className="bg-[#F0F0F1] dark:bg-surface-2">
                                    <tr className="border-b border-line">
                                        <th className="h-10 px-3.5 text-left text-xs font-semibold text-ink-2">Plan</th>
                                        <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">Cycle</th>
                                        <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">Duration</th>
                                        <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">Grace</th>
                                        {can.viewPricing && <th className="h-10 px-3 text-right text-xs font-semibold text-ink-2">Price</th>}
                                        <th className="h-10 w-10 px-3.5" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.map((plan) => (
                                        <tr
                                            key={plan.id}
                                            className="border-b border-line/70 transition-colors last:border-b-0 hover:bg-surface-2"
                                        >
                                            <td className="h-[60px] px-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-ink">{plan.name}</span>
                                                    <span className="num text-2xs text-ink-3">{plan.code}</span>
                                                    {!plan.is_active && (
                                                        <Badge tone="neutral" size="sm">
                                                            Off
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-3">
                                                <Badge tone={toneForCycle(plan.billing_cycle)} size="sm">
                                                    {plan.billing_cycle.replace(/_/g, ' ')}
                                                </Badge>
                                            </td>
                                            <td className="num px-3 text-2xs text-ink-2">
                                                {plan.duration_days === null ? 'No expiry' : `${plan.duration_days}d`}
                                            </td>
                                            <td className="num px-3 text-2xs text-ink-2">{plan.grace_days}d</td>
                                            {can.viewPricing && (
                                                <td className="num px-3 text-right text-xs font-medium text-ink">
                                                    {money(plan.price, plan.currency)}
                                                </td>
                                            )}
                                            <td className="px-3.5 text-right">
                                                {can.managePlans && !product.deleted_at && (
                                                    <Link href={`/plans/${plan.id}/edit`}>
                                                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${plan.name}`}>
                                                            <Pencil />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </Card>

                    <Card>
                        <CardHeader title="History" />
                        {activities.length === 0 ? (
                            <CardBody>
                                <EmptyState title="No recorded changes" />
                            </CardBody>
                        ) : (
                            <ul className="divide-y divide-line/70">
                                {activities.map((activity) => (
                                    <li key={activity.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
                                        <Avatar name={activity.user?.name ?? 'System'} size="sm" />
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-xs text-ink">
                                                {activity.description ?? activity.event}
                                            </p>
                                            <p className="truncate text-2xs text-ink-3">
                                                {activity.user?.name ?? 'System'} · {dateTime(activity.created_at)}
                                            </p>
                                        </div>
                                        <Badge tone={toneForEvent(activity.event)} size="sm">
                                            {activity.event.split('.').pop()}
                                        </Badge>
                                        <time suppressHydrationWarning className="num w-12 shrink-0 text-right text-2xs text-ink-3">
                                            {relativeTime(activity.created_at)}
                                        </time>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="h-fit">
                        <CardHeader title="Details" />
                        <CardBody className="py-2">
                            <dl className="divide-y divide-line/70">
                                <Detail label="Code">
                                    <span className="num rounded bg-surface-3 px-1.5 py-0.5 text-2xs font-medium">
                                        {product.code}
                                    </span>
                                </Detail>
                                <Detail label="Status">
                                    <StatusBadge active={product.is_active} />
                                </Detail>
                                <Detail label="Technical owner">
                                    {product.technical_owner ? (
                                        <span className="inline-flex items-center gap-1.5">
                                            <Avatar name={product.technical_owner.name} size="xs" />
                                            {product.technical_owner.name}
                                        </span>
                                    ) : (
                                        <span className="text-ink-3">Unassigned</span>
                                    )}
                                </Detail>
                                <Detail label="Support team">
                                    {product.support_role?.name ?? <span className="text-ink-3">Unassigned</span>}
                                </Detail>
                                <Detail label="Default trial">
                                    {product.default_trial_days ? (
                                        <span className="num">{product.default_trial_days} days</span>
                                    ) : (
                                        <span className="text-ink-3">—</span>
                                    )}
                                </Detail>
                            </dl>
                        </CardBody>
                    </Card>

                    {product.description && (
                        <Card>
                            <CardHeader title="Description" />
                            <CardBody>
                                <p className="text-xs leading-relaxed text-ink-2">{product.description}</p>
                            </CardBody>
                        </Card>
                    )}

                    <Card>
                        <CardHeader title="Setup notes" />
                        <CardBody>
                            <p className={product.demo_notes ? 'text-xs leading-relaxed whitespace-pre-line text-ink-2' : 'text-xs text-ink-3'}>
                                {product.demo_notes || 'No setup notes added.'}
                            </p>
                        </CardBody>
                    </Card>
                </div>
            </div>

            <Modal
                open={archiveOpen}
                onClose={() => setArchiveOpen(false)}
                title="Archive product"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setArchiveOpen(false)}>Cancel</Button>
                        <Button
                            variant="danger"
                            onClick={() => {
                                setArchiveOpen(false);
                                router.delete(`/products/${product.id}`);
                            }}
                        >
                            Archive product
                        </Button>
                    </>
                }
            >
                <div className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warn-wash text-warn">
                        <TriangleAlert className="size-4" />
                    </span>
                    <div>
                        <p className="text-xs font-medium text-ink">Archive {product.name}?</p>
                        <p className="mt-1 text-2xs leading-5 text-ink-2">
                            The product will be hidden from the active catalogue. Its plans and history will remain available.
                        </p>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
