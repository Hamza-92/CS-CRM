import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronLeft, ChevronRight, CheckSquare, Clock3, ListChecks } from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import type { BadgeTone } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface CalendarEvent {
    id: string;
    type: 'Task' | 'Follow-up';
    title: string;
    detail: string;
    date: string | null;
    href: string;
    status: string;
    tone: BadgeTone;
}

interface Props {
    month: string;
    monthLabel: string;
    previousMonth: string;
    nextMonth: string;
    todayMonth: string;
    events: CalendarEvent[];
    summary: { tasks: number; followUps: number; overdue: number };
    can: { tasks: boolean; followUps: boolean };
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function dayKey(year: number, month: number, day: number) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function CalendarIndex({ month, monthLabel, previousMonth, nextMonth, todayMonth, events, summary, can }: Props) {
    const [year, monthNumber] = month.split('-').map(Number);
    const monthIndex = monthNumber - 1;
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells = Array.from({ length: Math.ceil((firstDay + daysInMonth) / 7) * 7 }, (_, index) => {
        const day = index - firstDay + 1;
        return day > 0 && day <= daysInMonth ? { day, key: dayKey(year, monthIndex, day) } : { day: 0, key: '' };
    });
    const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((grouped, event) => {
        if (event.date) (grouped[event.date] ??= []).push(event);
        return grouped;
    }, {});
    const today = new Date();
    const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());

    return (
        <AppLayout>
            <Head title="Calendar" />
            <PageHeader
                title="Calendar"
                description="Keep tasks and follow-ups visible across the month."
                actions={
                    <div className="flex items-center gap-2">
                        <Link href={`/calendar?month=${previousMonth}`} className={buttonVariants({ variant: 'secondary', size: 'icon-sm' })} aria-label="Previous month"><ChevronLeft /></Link>
                        <Link href={`/calendar?month=${todayMonth}`} className={buttonVariants({ variant: 'secondary', size: 'sm' })}>Today</Link>
                        <Link href={`/calendar?month=${nextMonth}`} className={buttonVariants({ variant: 'secondary', size: 'icon-sm' })} aria-label="Next month"><ChevronRight /></Link>
                    </div>
                }
            />

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <StatCard label="Tasks this month" value={summary.tasks} icon={CheckSquare} tone="brand" variant="featured" href="/tasks" caption="Scheduled work" />
                <StatCard label="Follow-ups this month" value={summary.followUps} icon={ListChecks} tone="info" variant="featured" href="/follow-ups" caption="Scheduled conversations" />
                <StatCard label="Overdue items" value={summary.overdue} icon={Clock3} tone="bad" variant="featured" href="/calendar" caption="Needs attention" />
            </div>

            <Card className="overflow-hidden">
                <CardHeader title={monthLabel} action={<div className="flex items-center gap-3 text-2xs text-ink-3"><span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-brand" /> Task</span><span className="inline-flex items-center gap-1"><span className="size-1.5 rounded-full bg-info" /> Follow-up</span></div>} />
                <div className="grid grid-cols-7 border-b border-line bg-surface-2 text-center text-2xs font-semibold uppercase tracking-wider text-ink-3">
                    {weekdays.map((weekday) => <div key={weekday} className="px-2 py-2">{weekday}</div>)}
                </div>
                <div className="grid grid-cols-7">
                    {cells.map(({ day, key }, index) => {
                        const dayEvents = key ? eventsByDate[key] ?? [] : [];
                        const isToday = key === todayKey;
                        return <div key={`${key}-${index}`} className={cn('min-h-32 border-b border-r border-line p-2 last:border-r-0', !key && 'bg-surface-2/25')}>
                            {key && <div className={cn('mb-1 flex size-6 items-center justify-center rounded-full text-xs', isToday ? 'bg-brand font-semibold text-brand-ink' : 'text-ink-3')}>{day}</div>}
                            <div className="space-y-1">
                                {dayEvents.slice(0, 3).map((event) => <Link key={event.id} href={event.href} className={cn('block truncate rounded-md border bg-surface px-1.5 py-1 text-2xs font-medium shadow-card transition-all hover:-translate-y-px hover:shadow-lg', event.type === 'Task' ? 'border-brand/30 text-brand' : 'border-info/30 text-info')} title={`${event.title} · ${event.detail}`}><span className="mr-1 opacity-70">{event.type === 'Task' ? 'T' : 'F'}</span>{event.title}</Link>)}
                                {dayEvents.length > 3 && <span className="block px-1.5 text-[10px] font-medium text-ink-3">+{dayEvents.length - 3} more</span>}
                            </div>
                        </div>;
                    })}
                </div>
            </Card>

            {events.length === 0 && <Card className="mt-4"><CardBody><EmptyState icon={CalendarDays} title="Nothing scheduled" description="Create a task or follow-up to see it on the calendar." /></CardBody></Card>}
            {!can.tasks && !can.followUps && <Card className="mt-4"><CardBody><EmptyState icon={CalendarDays} title="Calendar access is restricted" /></CardBody></Card>}
        </AppLayout>
    );
}
