import { Link, router } from '@inertiajs/react';
import { ArrowRight, Building2, CalendarDays, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { shortDate } from '@/lib/format';
import type { Lead } from '@/types';

export interface LeadBoardColumn {
    id: number;
    slug: string;
    name: string;
    color: string;
    description: string | null;
    leads: Lead[];
}

const actionButton = 'flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-3.5';

function colorWithAlpha(color: string, alpha: string) {
    return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : color;
}

export function LeadBoard({ columns, canUpdate, canArchive, canConvert }: { columns: LeadBoardColumn[]; canUpdate: boolean; canArchive: boolean; canConvert: boolean }) {
    const [board, setBoard] = useState(columns);
    const [draggedId, setDraggedId] = useState<number | null>(null);

    useEffect(() => setBoard(columns), [columns]);

    function moveLead(targetSlug: string) {
        if (!draggedId || !canUpdate) return;
        const source = board.find((column) => column.leads.some((lead) => lead.id === draggedId));
        const lead = source?.leads.find((item) => item.id === draggedId);
        if (!lead || source?.slug === targetSlug) return;

        setBoard((current) => current.map((column) => ({
            ...column,
            leads: column.slug === source?.slug
                ? column.leads.filter((item) => item.id !== draggedId)
                : column.slug === targetSlug
                    ? [...column.leads, { ...lead, status: targetSlug, status_label: current.find((item) => item.slug === targetSlug)?.name ?? lead.status_label }]
                    : column.leads,
        })));
        router.patch(`/leads/${lead.id}/status`, { status: targetSlug }, { preserveScroll: true, onError: () => setBoard(columns) });
        setDraggedId(null);
    }

    return <div className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-3">
        {board.map((column) => <section key={column.slug} className="flex min-w-[300px] flex-1 flex-col overflow-hidden rounded-xl border bg-surface-2/70" style={{ borderColor: colorWithAlpha(column.color, '55'), backgroundColor: colorWithAlpha(column.color, '0d') }} onDragOver={(event) => event.preventDefault()} onDrop={() => moveLead(column.slug)}>
            <div className="flex min-h-[48px] items-center justify-between gap-2 border-b px-4" style={{ borderColor: colorWithAlpha(column.color, '55'), backgroundColor: colorWithAlpha(column.color, '18') }}>
                <div className="flex min-w-0 items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: column.color }} /><h2 className="truncate text-sm font-semibold text-ink">{column.name}</h2><span className="num rounded-full px-1.5 py-0.5 text-2xs font-semibold" style={{ color: column.color, backgroundColor: colorWithAlpha(column.color, '22') }}>{column.leads.length}</span></div>
                {canUpdate && <Tooltip label="Add lead"><Link href={`/leads/create?status=${column.slug}`} className="flex size-8 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-surface hover:text-ink"><Plus className="size-5" /></Link></Tooltip>}
            </div>
            <div className="min-h-24 max-h-[calc(100vh-330px)] space-y-3 overflow-y-auto p-4">
                {column.leads.map((lead) => <LeadBoardCard key={lead.id} lead={lead} color={column.color} canUpdate={canUpdate} canArchive={canArchive} canConvert={canConvert} onDragStart={() => setDraggedId(lead.id)} />)}
                {column.leads.length === 0 && <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-line px-3 text-center text-2xs text-ink-3">Drop leads here</div>}
            </div>
        </section>)}
    </div>;
}

function LeadBoardCard({ lead, color, canUpdate, canArchive, canConvert, onDragStart }: { lead: Lead; color: string; canUpdate: boolean; canArchive: boolean; canConvert: boolean; onDragStart: () => void }) {
    const hoverShadow = `0 10px 24px -14px ${color}cc, 0 3px 8px -5px ${color}88`;
    return <Card draggable={canUpdate} onDragStart={onDragStart} className="group relative overflow-visible border border-line border-t-2 bg-surface p-4 shadow-none before:hidden transition-all duration-150 hover:-translate-y-0.5 hover:[box-shadow:var(--lead-shadow)]" style={{ borderTopColor: color, ['--lead-shadow' as string]: hoverShadow } as CSSProperties}>
        <div className="flex items-start gap-3"><span className="rounded-full border p-px" style={{ borderColor: color, backgroundColor: colorWithAlpha(color, '15') }}><Avatar name={lead.name} size="lg" className="bg-transparent" /></span><div className="min-w-0 flex-1"><Link href={`/leads/${lead.id}`} className="block truncate text-sm font-semibold text-ink hover:text-brand">{lead.name}</Link><p className="mt-0.5 truncate text-xs text-ink-3">{lead.email ?? lead.phone ?? 'No contact details'}</p></div></div>
        {lead.business && <div className="mt-4 flex items-center gap-2 text-xs text-ink-2"><Building2 className="size-4 text-ink-3" /> <span className="truncate">{lead.business}</span></div>}
        <div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-md border px-2.5 py-1 text-xs font-medium" style={{ color, borderColor: colorWithAlpha(color, '55'), backgroundColor: colorWithAlpha(color, '12') }}>{lead.source_label ?? 'No source'}</span>{lead.status === 'converted' && <Badge tone="ok" size="sm">Converted</Badge>}</div>
        <div className="mt-4 flex items-center justify-between border-t border-line pt-3"><span className="inline-flex items-center gap-1.5 text-xs text-ink-3"><CalendarDays className="size-4" />{shortDate(lead.created_at)}</span><div className="flex items-center gap-0.5">{lead.owner && <Avatar name={lead.owner.name} src={lead.owner.avatar_url} size="sm" className="mr-1" />}<Tooltip label="View"><Link href={`/leads/${lead.id}`} className={actionButton}><Eye /></Link></Tooltip>{canUpdate && <Tooltip label="Edit"><Link href={`/leads/${lead.id}/edit`} className={`${actionButton} hover:text-warn`}><Pencil /></Link></Tooltip>}{canConvert && lead.status !== 'converted' && <Tooltip label="Convert"><button type="button" onClick={() => router.post(`/leads/${lead.id}/convert`)} className={`${actionButton} hover:text-brand`}><ArrowRight /></button></Tooltip>}{canArchive && <Tooltip label="Archive"><button type="button" onClick={() => router.delete(`/leads/${lead.id}`)} className={`${actionButton} hover:bg-bad-wash hover:text-bad`}><Trash2 /></button></Tooltip>}</div></div>
    </Card>;
}
