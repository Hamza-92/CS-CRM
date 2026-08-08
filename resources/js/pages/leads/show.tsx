import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, CalendarDays, Mail, MapPin, Pencil, Phone, Trash2, UserRound } from 'lucide-react';
import { FollowUpSummary, type FollowUpSummaryItem } from '@/components/follow-ups/follow-up-summary';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { Activity, Lead, ProductRef } from '@/types';
import { dateTime, relativeTime, shortDate, toneForEvent } from '@/lib/format';

function statusTone(status: string) {
    if (status === 'converted' || status === 'trial_running') return 'ok' as const;
    if (status === 'demo_required' || status === 'demo_setup' || status === 'call_later') return 'warn' as const;
    if (status === 'lost' || status === 'not_interested' || status === 'other_software') return 'bad' as const;
    return 'info' as const;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
    return <div className="flex items-baseline justify-between gap-4 border-b border-line/70 py-3 last:border-b-0"><dt className="text-xs text-ink-3">{label}</dt><dd className="min-w-0 text-right text-xs font-medium text-ink">{children}</dd></div>;
}

function ActivityHistory({ activities }: { activities: Activity[] }) {
    return <Card><CardHeader title="Activity" meta={activities.length ? `${activities.length}` : undefined} />{activities.length ? <ul className="divide-y divide-line/70">{activities.map((activity) => <li key={activity.id} className="flex items-center gap-2.5 px-3.5 py-2.5"><Avatar name={activity.user?.name ?? 'System'} src={activity.user?.avatar_url} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs text-ink">{activity.description ?? activity.event}</p><p className="truncate text-2xs text-ink-3">{activity.user?.name ?? 'System'} · {dateTime(activity.created_at)}</p></div><Badge tone={toneForEvent(activity.event)} size="sm">{activity.event.split('.').pop()}</Badge><time suppressHydrationWarning className="num w-12 shrink-0 text-right text-2xs text-ink-3">{relativeTime(activity.created_at)}</time></li>)}</ul> : <CardBody><p className="text-xs text-ink-3">No activity recorded.</p></CardBody>}</Card>;
}

export default function LeadShow({ lead, products, activities, followUps, can }: { lead: Lead; products: ProductRef[]; activities: Activity[]; followUps: FollowUpSummaryItem[]; can: { update: boolean; create_follow_up: boolean; archive: boolean; convert: boolean } }) {
    return <AppLayout><Head title={lead.name} /><PageHeader title={lead.name} badge={<Badge tone={statusTone(lead.status)} size="sm">{lead.status_label}</Badge>} actions={<div className="flex flex-wrap items-center gap-2"><Link href="/leads"><Button variant="secondary"><ArrowLeft /> Back to Leads</Button></Link>{can.update && lead.status !== 'converted' && <Link href={`/leads/${lead.id}/edit`}><Button variant="secondary"><Pencil /> Edit</Button></Link>}{can.convert && !lead.customer_id && <Button onClick={() => router.post(`/leads/${lead.id}/convert`)}><ArrowRight /> Convert to customer</Button>}{can.archive && <Tooltip label="Archive lead"><button type="button" onClick={() => router.delete(`/leads/${lead.id}`)} className="flex size-9 items-center justify-center rounded-md border border-line-2 text-bad shadow-card transition-colors hover:bg-bad-wash"><Trash2 className="size-4" /></button></Tooltip>}</div>} /><div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]"><Card><CardHeader title="Lead overview" meta={`Added ${shortDate(lead.created_at)}`} /><CardBody><dl><Detail label="Business">{lead.business ?? '-'}</Detail><Detail label="Email">{lead.email ? <a className="text-brand hover:underline" href={`mailto:${lead.email}`}><Mail className="mr-1 inline size-3.5" />{lead.email}</a> : '-'}</Detail><Detail label="Phone">{lead.phone ? <a className="num text-brand hover:underline" href={`tel:${lead.phone}`}><Phone className="mr-1 inline size-3.5" />{lead.phone}</a> : '-'}</Detail><Detail label="WhatsApp">{lead.whatsapp ?? '-'}</Detail><Detail label="Location">{lead.city ? <span><MapPin className="mr-1 inline size-3.5 text-ink-3" />{lead.city}</span> : '-'}</Detail><Detail label="Lead owner">{lead.owner ? <span className="inline-flex items-center gap-1.5"><Avatar name={lead.owner.name} src={lead.owner.avatar_url} size="xs" />{lead.owner.name}</span> : 'Unassigned'}</Detail><Detail label="Source">{lead.source_label ?? 'Not specified'}</Detail><Detail label="Next follow-up">{lead.next_follow_up_at ? <span className="num"><CalendarDays className="mr-1 inline size-3.5 text-ink-3" />{dateTime(lead.next_follow_up_at)}</span> : 'Not scheduled'}</Detail></dl></CardBody></Card><div className="space-y-4"><FollowUpSummary followUps={followUps} parentType="lead" parentId={lead.id} canCreate={can.update} /><ActivityHistory activities={activities} /><Card><CardHeader title="Interested products" meta={`${products.length}`} /><CardBody>{products.length ? <div className="flex flex-wrap gap-2">{products.map((product) => <Badge key={product.id} tone="brand" size="md">{product.name}</Badge>)}</div> : <p className="text-xs text-ink-3">No products selected.</p>}</CardBody></Card><Card><CardHeader title="Notes" /><CardBody>{lead.notes ? <p className="text-xs leading-relaxed whitespace-pre-line text-ink-2">{lead.notes}</p> : <p className="text-xs text-ink-3">No notes added.</p>}</CardBody></Card>{lead.customer && <Card><CardHeader title="Converted customer" /><CardBody><Link href={`/customers/${lead.customer.id}`} className="flex items-center gap-2 text-xs font-medium text-brand hover:underline"><UserRound className="size-4" />{lead.customer.name}</Link></CardBody></Card>}</div></div></AppLayout>;
}
