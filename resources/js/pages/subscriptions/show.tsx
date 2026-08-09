import { Head, Link, router } from '@inertiajs/react';
import { Archive, ArrowLeft, CalendarClock, ExternalLink, Pencil, RefreshCw, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Activity, Subscription, SubscriptionRenewal } from '@/types';

const tone: Record<string, 'ok' | 'warn' | 'bad' | 'info' | 'neutral'> = {
    trialing: 'info', active: 'ok', past_due: 'bad', paused: 'warn', expired: 'neutral', cancelled: 'neutral',
};

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return <div><div className="text-xs uppercase tracking-wider text-ink-3">{label}</div><div className="mt-1 text-sm text-ink-2">{children}</div></div>;
}

function date(value: string | null) {
    return value ? new Date(value).toLocaleDateString() : '—';
}

export default function SubscriptionShow({ subscription, renewals, activities, can }: { subscription: Subscription; renewals: SubscriptionRenewal[]; activities: Activity[]; can: { update: boolean; archive: boolean; renew: boolean } }) {
    return <AppLayout>
        <Head title="Subscription" />
        <PageHeader title={subscription.plan?.name || 'Subscription'} description={`${subscription.application_instance?.name || 'Instance'} · ${subscription.application_instance?.customer?.business || subscription.application_instance?.customer?.name || 'Customer'}`} actions={<div className="flex gap-2"><Link href="/subscriptions"><Button variant="secondary"><ArrowLeft /> Back to Subscriptions</Button></Link>{can.update && <Link href={`/subscriptions/${subscription.id}/edit`}><Button variant="secondary"><Pencil /> Edit</Button></Link>}{can.renew && !subscription.deleted_at && <Button onClick={() => router.patch(`/subscriptions/${subscription.id}/renew`)}><RefreshCw /> Renew</Button>}{subscription.deleted_at ? <Button onClick={() => router.patch(`/subscriptions/${subscription.id}/restore`)}><RotateCcw /> Restore</Button> : can.archive && <Button variant="secondary" onClick={() => router.delete(`/subscriptions/${subscription.id}`)}><Archive /> Archive</Button>}</div>} />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,.8fr)]">
            <div className="space-y-4">
                <Card><CardHeader title="Lifecycle overview" action={<Badge tone={tone[subscription.status] ?? 'neutral'}>{subscription.status_label ?? subscription.status}</Badge>} /><CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><Detail label="Record type">{subscription.kind_label ?? subscription.kind}</Detail><Detail label="Plan">{subscription.plan?.name} <span className="text-xs text-ink-3">({subscription.plan?.code})</span></Detail><Detail label="Auto renewal">{subscription.auto_renew ? 'Enabled' : 'Disabled'}</Detail><Detail label="Starts on">{date(subscription.starts_at)}</Detail><Detail label="Ends on">{date(subscription.ends_at)}</Detail><Detail label="Renewal date">{subscription.renewal_at ? <span className="inline-flex items-center gap-1"><CalendarClock className="size-3.5 text-ink-3" />{date(subscription.renewal_at)}</span> : 'Not scheduled'}</Detail><Detail label="Grace period">{date(subscription.grace_ends_at)}</Detail><Detail label="Days remaining">{subscription.days_remaining === null || subscription.days_remaining === undefined ? 'Open ended' : subscription.days_remaining < 0 ? `${Math.abs(subscription.days_remaining)} days overdue` : `${subscription.days_remaining} days`}</Detail><Detail label="External reference">{subscription.external_reference || 'Not specified'}</Detail></CardBody></Card>
                <Card><CardHeader title="Renewal history" meta={`${renewals.length}`} /><CardBody>{renewals.length ? <div className="space-y-3">{renewals.map((renewal) => <div key={renewal.id} className="rounded-lg border border-line bg-surface-2 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="font-medium text-ink">Renewed {date(renewal.starts_at)}</div><Badge tone="ok" size="sm">{renewal.status}</Badge></div><div className="mt-2 grid gap-2 text-xs text-ink-3 sm:grid-cols-3"><span>Ends {date(renewal.ends_at)}</span><span>{renewal.plan?.name || 'Current plan'}</span><span>{renewal.payment ? `Payment ${renewal.payment.invoice_number}` : 'No payment linked'}</span></div>{renewal.amount && <div className="mt-2 text-xs font-medium text-ink-2">{renewal.currency || ''} {Number(renewal.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>}</div>)}</div> : <p className="text-sm text-ink-3">No renewals recorded yet.</p>}</CardBody></Card>
                <Card><CardHeader title="Activity" meta={`${activities.length}`} /><CardBody>{activities.length ? <div className="space-y-3">{activities.map((activity) => <div key={activity.id} className="border-l-2 border-brand/30 pl-3"><div className="text-sm text-ink">{activity.description || activity.event}</div><div className="mt-0.5 text-xs text-ink-3">{activity.user?.name || 'System'} · {new Date(activity.created_at).toLocaleString()}</div></div>)}</div> : <p className="text-sm text-ink-3">No activity recorded yet.</p>}</CardBody></Card>
            </div>
            <div className="space-y-4"><Card><CardHeader title="Operational context" /><CardBody className="space-y-3"><Link href={`/instances/${subscription.application_instance_id}`} className="flex items-center justify-between rounded-lg bg-surface-2 p-3 text-sm hover:bg-surface-3"><span><span className="block text-xs text-ink-3">Instance</span><span className="font-medium text-ink">{subscription.application_instance?.name}</span></span><ExternalLink className="size-4 text-ink-3" /></Link><div className="rounded-lg bg-surface-2 p-3 text-sm"><div className="text-xs text-ink-3">Product</div><div className="mt-1 font-medium text-ink">{subscription.application_instance?.product?.name || '—'}</div></div><div className="rounded-lg bg-surface-2 p-3 text-sm"><div className="text-xs text-ink-3">Customer</div><div className="mt-1 font-medium text-ink">{subscription.application_instance?.customer?.business || subscription.application_instance?.customer?.name || '—'}</div></div></CardBody></Card>{subscription.notes && <Card><CardHeader title="Notes" /><CardBody><p className="whitespace-pre-wrap text-sm text-ink-2">{subscription.notes}</p></CardBody></Card>}</div>
        </div>
    </AppLayout>;
}
