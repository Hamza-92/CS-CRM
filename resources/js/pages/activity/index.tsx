import { Head } from '@inertiajs/react';
import { History } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader, Toolbar } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { Activity, Paginated } from '@/types';
import { dateTime, relativeTime, toneForEvent } from '@/lib/format';

interface Props {
    activities: Paginated<Activity>;
    eventPrefixes: string[];
    filters: { event: string; user_id: string; from: string; to: string };
}

function Changes({ activity }: { activity: Activity }) {
    const [open, setOpen] = useState(false);
    const properties = activity.properties;

    if (!properties) {
        return null;
    }

    const keys = Object.keys({ ...(properties.new ?? {}), ...(properties.old ?? {}) });

    if (keys.length === 0) {
        return null;
    }

    return (
        <div className="mt-1.5">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="text-2xs font-medium text-brand hover:underline"
            >
                {open ? 'Hide changes' : `${keys.length} field${keys.length === 1 ? '' : 's'} changed`}
            </button>
            {open && (
                <dl className="mt-1.5 space-y-1 rounded-md border border-line bg-surface-2 p-2">
                    {keys.map((key) => (
                        <div key={key} className="flex flex-wrap items-baseline gap-1.5 text-2xs">
                            <dt className="font-medium text-ink-2">{key}</dt>
                            <dd className="flex flex-wrap items-baseline gap-1.5">
                                {properties.old && key in properties.old && (
                                    <>
                                        <span className="num rounded bg-bad-wash px-1 text-bad line-through">
                                            {String(properties.old[key] ?? '—')}
                                        </span>
                                        <span className="text-ink-3">→</span>
                                    </>
                                )}
                                <span className="num rounded bg-ok-wash px-1 text-ok">
                                    {String(properties.new?.[key] ?? '—')}
                                </span>
                            </dd>
                        </div>
                    ))}
                </dl>
            )}
        </div>
    );
}

export default function ActivityIndex({ activities, eventPrefixes, filters }: Props) {
    const { values, set } = useFilters('/activity', {
        event: filters.event,
        user_id: filters.user_id,
        from: filters.from,
        to: filters.to,
    });

    return (
        <AppLayout>
            <Head title="Activity log" />

            <PageHeader
                title="Activity log"
                badge={
                    <Badge tone="neutral" size="sm">
                        Append-only
                    </Badge>
                }
            />

            <Card>
                <Toolbar>
                    <Select
                        aria-label="Filter by event type"
                        className="w-auto"
                        value={values.event ?? ''}
                        onChange={(event) => set('event', event.target.value)}
                    >
                        <option value="">All events</option>
                        {eventPrefixes.map((prefix) => (
                            <option key={prefix} value={prefix}>
                                {prefix}
                            </option>
                        ))}
                    </Select>
                    <Input
                        type="date"
                        aria-label="From date"
                        className="num w-auto"
                        value={values.from ?? ''}
                        onChange={(event) => set('from', event.target.value)}
                    />
                    <span className="text-2xs text-ink-3">to</span>
                    <Input
                        type="date"
                        aria-label="To date"
                        className="num w-auto"
                        value={values.to ?? ''}
                        onChange={(event) => set('to', event.target.value)}
                    />
                </Toolbar>

                {activities.data.length === 0 ? (
                    <div className="px-3.5 py-10">
                        <EmptyState icon={History} title="No activity recorded" />
                    </div>
                ) : (
                    <ul className="divide-y divide-line/70">
                        {activities.data.map((activity) => (
                            <li key={activity.id} className="flex items-start gap-2.5 px-3.5 py-2.5">
                                <Avatar name={activity.user?.name ?? 'System'} size="sm" className="mt-0.5" />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <span className="text-xs text-ink">{activity.description ?? activity.event}</span>
                                        <Badge tone={toneForEvent(activity.event)} size="sm">
                                            {activity.event}
                                        </Badge>
                                    </div>
                                    <p className="mt-0.5 text-2xs text-ink-3">
                                        {activity.user?.name ?? 'System'}
                                        {activity.ip_address && <span className="num"> · {activity.ip_address}</span>}
                                    </p>
                                    <Changes activity={activity} />
                                </div>
                                <time
                                    suppressHydrationWarning
                                    dateTime={activity.created_at}
                                    title={dateTime(activity.created_at)}
                                    className="num w-12 shrink-0 pt-0.5 text-right text-2xs text-ink-3"
                                >
                                    {relativeTime(activity.created_at)}
                                </time>
                            </li>
                        ))}
                    </ul>
                )}

                <Pagination meta={activities} />
            </Card>
        </AppLayout>
    );
}
