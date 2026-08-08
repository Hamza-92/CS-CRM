import { Link } from '@inertiajs/react';
import { CalendarClock, Plus } from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { FollowUp } from '@/types';
import { dateTime } from '@/lib/format';

export type FollowUpSummaryItem = Pick<FollowUp, 'id' | 'reason' | 'scheduled_at' | 'status' | 'status_label' | 'is_overdue' | 'owner'>;

export function FollowUpSummary({ followUps, parentType, parentId, canCreate }: { followUps: FollowUpSummaryItem[]; parentType: 'lead' | 'customer'; parentId: number; canCreate: boolean }) {
    return <Card><CardHeader title="Follow-ups" meta={`${followUps.length}`} action={canCreate ? <Link href={`/follow-ups/create?${parentType}_id=${parentId}`}><Button size="sm" variant="secondary"><Plus /> Add</Button></Link> : undefined} /><CardBody className="space-y-2">{followUps.length === 0 ? <p className="text-xs text-ink-3">No follow-ups scheduled.</p> : followUps.slice(0, 5).map((followUp) => <div key={followUp.id} className="flex items-center gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5"><CalendarClock className={`size-4 shrink-0 ${followUp.is_overdue ? 'text-bad' : 'text-ink-3'}`} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-ink">{followUp.reason}</p><p className={`num mt-0.5 text-2xs ${followUp.is_overdue ? 'font-semibold text-bad' : 'text-ink-3'}`}>{dateTime(followUp.scheduled_at)}</p></div>{followUp.owner && <Avatar name={followUp.owner.name} src={followUp.owner.avatar_url} size="xs" />}<Badge tone={followUp.is_overdue ? 'bad' : followUp.status === 'completed' ? 'ok' : 'info'} size="sm">{followUp.is_overdue ? 'Overdue' : followUp.status_label}</Badge></div>)}</CardBody></Card>;
}
