import { Link, router } from '@inertiajs/react';
import { Building2, CalendarDays, Eye, Pencil, Plus } from 'lucide-react';
import { useEffect, useState, type CSSProperties } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import type { Deal, DealStage } from '@/types';
import { money, shortDate } from '@/lib/format';

export interface DealBoardColumn extends DealStage { deals: Deal[] }
const actionButton = 'flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-3.5';
const alpha = (color: string, value: string) => /^#[0-9a-f]{6}$/i.test(color) ? `${color}${value}` : color;

export function DealBoard({ columns, canUpdate }: { columns: DealBoardColumn[]; canUpdate: boolean }) {
    const [board, setBoard] = useState(columns);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [terminalMove, setTerminalMove] = useState<{ deal: Deal; stage: DealBoardColumn } | null>(null);
    const [lossReason, setLossReason] = useState('');
    useEffect(() => setBoard(columns), [columns]);

    function move(target: DealBoardColumn) {
        const source = board.find((column) => column.deals.some((deal) => deal.id === draggedId));
        const deal = source?.deals.find((item) => item.id === draggedId);
        if (!deal || !source || source.id === target.id || !canUpdate) return;
        if (target.is_won || target.is_lost) { setTerminalMove({ deal, stage: target }); setLossReason(''); setDraggedId(null); return; }
        setBoard((current) => current.map((column) => ({ ...column, deals: column.id === source.id ? column.deals.filter((item) => item.id !== deal.id) : column.id === target.id ? [...column.deals, { ...deal, stage_id: target.id, stage: target, probability: target.probability }] : column.deals })));
        router.patch(`/deals/${deal.id}/stage`, { stage_id: target.id }, { preserveScroll: true, onError: () => setBoard(columns) });
        setDraggedId(null);
    }

    function confirmTerminalMove() {
        if (!terminalMove || (terminalMove.stage.is_lost && !lossReason.trim())) return;
        router.patch(`/deals/${terminalMove.deal.id}/stage`, { stage_id: terminalMove.stage.id, loss_reason: lossReason }, { preserveScroll: true, onFinish: () => setTerminalMove(null) });
    }

    return <><div className="-mx-1 flex gap-5 overflow-x-auto px-1 pb-3">{board.map((column) => <section key={column.id} className="flex min-w-[310px] flex-1 flex-col overflow-hidden rounded-xl border" style={{ borderColor: alpha(column.color, '55'), backgroundColor: alpha(column.color, '0d') }} onDragOver={(event) => event.preventDefault()} onDrop={() => move(column)}><div className="flex min-h-[46px] items-center justify-between gap-2 border-b px-4" style={{ borderColor: alpha(column.color, '55'), backgroundColor: alpha(column.color, '17') }}><div className="flex min-w-0 items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: column.color }} /><h2 className="truncate text-sm font-semibold text-ink">{column.name}</h2><span className="num rounded-full px-1.5 py-0.5 text-2xs font-semibold" style={{ color: column.color, backgroundColor: alpha(column.color, '20') }}>{column.deals.length}</span></div>{canUpdate && <Tooltip label="Add deal"><Link href={`/deals/create?stage_id=${column.id}`} className="flex size-8 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-surface hover:text-ink"><Plus className="size-5" /></Link></Tooltip>}</div><div className="min-h-28 max-h-[calc(100vh-390px)] space-y-3 overflow-y-auto p-4">{column.deals.map((deal) => <DealCard key={deal.id} deal={deal} color={column.color} canUpdate={canUpdate} onDragStart={() => setDraggedId(deal.id)} />)}{column.deals.length === 0 && <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-line px-3 text-center text-2xs text-ink-3">Drop deals here</div>}</div></section>)}</div><Modal open={terminalMove !== null} onClose={() => setTerminalMove(null)} title={terminalMove?.stage.is_won ? 'Mark deal as won' : 'Mark deal as lost'} width="sm" footer={<><Button variant="secondary" onClick={() => setTerminalMove(null)}>Cancel</Button><Button variant={terminalMove?.stage.is_lost ? 'danger' : 'primary'} onClick={confirmTerminalMove} disabled={Boolean(terminalMove?.stage.is_lost && !lossReason.trim())}>{terminalMove?.stage.is_won ? 'Mark as won' : 'Mark as lost'}</Button></>}>{terminalMove?.stage.is_lost ? <div><p className="mb-3 text-xs text-ink-2">Record why <span className="font-semibold text-ink">{terminalMove.deal.title}</span> was lost.</p><Textarea rows={4} value={lossReason} onChange={(event) => setLossReason(event.target.value)} placeholder="Loss reason" /></div> : <p className="text-xs text-ink-2">Confirm that <span className="font-semibold text-ink">{terminalMove?.deal.title}</span> has been won.</p>}</Modal></>;
}

function DealCard({ deal, color, canUpdate, onDragStart }: { deal: Deal; color: string; canUpdate: boolean; onDragStart: () => void }) {
    const shadow = `0 10px 24px -14px ${color}cc, 0 3px 8px -5px ${color}88`;
    return <Card draggable={canUpdate} onDragStart={onDragStart} className="group relative overflow-visible border border-line border-t-2 bg-surface p-4 shadow-none before:hidden transition-all duration-150 hover:-translate-y-0.5 hover:[box-shadow:var(--deal-shadow)]" style={{ borderTopColor: color, ['--deal-shadow' as string]: shadow } as CSSProperties}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link href={`/deals/${deal.id}`} className="block truncate text-sm font-semibold text-ink hover:text-brand">{deal.title}</Link><p className="mt-0.5 truncate text-xs text-ink-3">{deal.customer?.name ?? deal.lead?.name ?? 'Unlinked contact'}</p></div><span className="num shrink-0 text-sm font-semibold text-ink">{money(deal.amount, deal.currency)}</span></div>{(deal.customer?.business || deal.lead?.business) && <div className="mt-3 flex items-center gap-2 text-xs text-ink-2"><Building2 className="size-4 text-ink-3" /><span className="truncate">{deal.customer?.business ?? deal.lead?.business}</span></div>}<div className="mt-3 flex items-center justify-between"><span className="rounded-md border px-2 py-1 text-2xs font-medium" style={{ color, borderColor: alpha(color, '55'), backgroundColor: alpha(color, '12') }}>{deal.probability}% probability</span>{deal.product && <span className="max-w-28 truncate text-2xs text-ink-3">{deal.product.name}</span>}</div><div className="mt-4 flex items-center justify-between border-t border-line pt-3"><span className="inline-flex items-center gap-1.5 text-xs text-ink-3"><CalendarDays className="size-4" />{shortDate(deal.expected_close_date)}</span><div className="flex items-center gap-0.5">{deal.owner && <Avatar name={deal.owner.name} src={deal.owner.avatar_url} size="sm" className="mr-1" />}<Tooltip label="View"><Link href={`/deals/${deal.id}`} className={actionButton}><Eye /></Link></Tooltip>{canUpdate && <Tooltip label="Edit"><Link href={`/deals/${deal.id}/edit`} className={`${actionButton} hover:text-warn`}><Pencil /></Link></Tooltip>}</div></div></Card>;
}
