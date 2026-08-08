import { Head, Link, router } from '@inertiajs/react';
import { ArrowUpRight, Bell, Check, CheckCheck, CircleAlert, Info, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { Paginated } from '@/types';
import { relativeTime } from '@/lib/format';

interface NotificationRow {
    id: string;
    type: string;
    data: {
        title?: string;
        message?: string;
        tone?: string;
        url?: string | null;
    };
    read_at: string | null;
    created_at: string;
}

function tone(value: string | undefined): BadgeTone {
    return value === 'ok' || value === 'warn' || value === 'bad' || value === 'info' || value === 'alt' || value === 'brand'
        ? value
        : 'neutral';
}

function Icon({ value }: { value: string | undefined }) {
    if (value === 'bad') return <CircleAlert className="size-4" />;
    if (value === 'ok') return <Check className="size-4" />;
    if (value === 'brand') return <Sparkles className="size-4" />;
    return value === 'warn' ? <Info className="size-4" /> : <Bell className="size-4" />;
}

export default function NotificationsIndex({ notifications, unreadCount }: { notifications: Paginated<NotificationRow>; unreadCount: number }) {
    return (
        <AppLayout>
            <Head title="Notifications" />
            <PageHeader
                title="Notifications"
                badge={<Badge tone={unreadCount > 0 ? 'brand' : 'neutral'} size="sm">{unreadCount} unread</Badge>}
                actions={unreadCount > 0 ? <Button variant="secondary" size="sm" onClick={() => router.patch('/notifications/read-all')}><CheckCheck /> Mark all read</Button> : undefined}
            />
            <Card>
                {notifications.data.length === 0 ? (
                    <CardBody><EmptyState icon={Bell} title="You're all caught up" description="New task assignments and workflow updates will appear here." /></CardBody>
                ) : (
                    <ul className="divide-y divide-line/70">
                        {notifications.data.map((item) => {
                            const itemTone = tone(item.data.tone);
                            const content = (
                                <>
                                    <span className={`flex size-8 shrink-0 items-center justify-center rounded-md ${item.read_at ? 'bg-surface-3 text-ink-3' : 'bg-brand-wash text-brand'}`}><Icon value={item.data.tone} /></span>
                                    <span className="min-w-0 flex-1">
                                        <span className="flex flex-wrap items-center gap-2"><span className={`text-xs ${item.read_at ? 'font-medium text-ink-2' : 'font-semibold text-ink'}`}>{item.data.title ?? 'Notification'}</span>{!item.read_at && <Badge tone={itemTone} size="sm" dot>New</Badge>}</span>
                                        <span className="mt-0.5 block text-xs leading-relaxed text-ink-2">{item.data.message ?? 'A workflow update needs your attention.'}</span>
                                        <span className="mt-1 block text-2xs text-ink-3">{relativeTime(item.created_at)}</span>
                                    </span>
                                    {item.data.url && <ArrowUpRight className="size-4 shrink-0 text-ink-3" />}
                                </>
                            );

                            return (
                                <li key={item.id} className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-2 ${!item.read_at ? 'bg-brand-wash/20' : ''}`}>
                                    {item.data.url ? <Link href={item.data.url} onClick={() => !item.read_at && router.patch(`/notifications/${item.id}/read`)} className="flex min-w-0 flex-1 items-start gap-3">{content}</Link> : <div className="flex min-w-0 flex-1 items-start gap-3">{content}</div>}
                                    {!item.read_at && <Button variant="ghost" size="icon-sm" aria-label="Mark as read" onClick={() => router.patch(`/notifications/${item.id}/read`)}><Check className="size-4" /></Button>}
                                </li>
                            );
                        })}
                    </ul>
                )}
                <Pagination meta={notifications} perPage={20} onPerPageChange={(value) => router.get('/notifications', { per_page: value }, { preserveState: true, preserveScroll: true })} />
            </Card>
        </AppLayout>
    );
}
