import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatTone = 'brand' | 'ok' | 'warn' | 'bad' | 'info' | 'alt';

const chip: Record<StatTone, string> = {
    brand: 'bg-brand-wash text-brand',
    ok: 'bg-ok-wash text-ok',
    warn: 'bg-warn-wash text-warn',
    bad: 'bg-bad-wash text-bad',
    info: 'bg-info-wash text-info',
    alt: 'bg-alt-wash text-alt',
};

const stroke: Record<StatTone, string> = {
    brand: 'text-brand',
    ok: 'text-ok',
    warn: 'text-warn',
    bad: 'text-bad',
    info: 'text-info',
    alt: 'text-alt',
};

export function Sparkline({ points, className }: { points: number[]; className?: string }) {
    if (points.length < 2) {
        return null;
    }

    const max = Math.max(...points);
    const min = Math.min(...points);
    const span = max - min || 1;
    const step = 100 / (points.length - 1);
    const coords = points.map((value, index) => [index * step, 26 - ((value - min) / span) * 22]);
    const line = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

    return (
        <svg viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true" className={cn('h-6 w-full', className)}>
            <path d={`${line} L100,28 L0,28 Z`} fill="currentColor" opacity="0.09" />
            <path
                d={line}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    );
}

export function StatCard({
    label,
    value,
    icon: Icon,
    tone = 'brand',
    delta,
    caption,
    trend,
    href,
}: {
    label: string;
    value: string | number;
    icon: LucideIcon;
    tone?: StatTone;
    delta?: number;
    caption?: string;
    trend?: number[];
    href?: string;
}) {
    const body = (
        <>
            <div className="flex items-center justify-between gap-2">
                <p className="eyebrow truncate text-ink-3">{label}</p>
                <span className={cn('flex size-6 shrink-0 items-center justify-center rounded', chip[tone])}>
                    <Icon className="size-3" />
                </span>
            </div>

            <div className="mt-2 flex items-baseline gap-1.5">
                <p className="num text-2xl leading-none font-semibold text-ink">{value}</p>
                {delta !== undefined && (
                    <span className={cn('num text-2xs font-semibold', delta >= 0 ? 'text-ok' : 'text-bad')}>
                        {delta >= 0 ? '+' : ''}
                        {delta}%
                    </span>
                )}
            </div>

            {caption && <p className="mt-1 truncate text-2xs text-ink-3">{caption}</p>}

            {trend && <Sparkline points={trend} className={cn('mt-2 -mb-1', stroke[tone])} />}
        </>
    );

    const shell = cn(
        'block rounded-lg border border-line bg-surface p-3 shadow-card transition-all duration-150',
        href && 'hover:-translate-y-px hover:border-line-2 hover:shadow-pop',
    );

    return href ? (
        <Link href={href} className={shell}>
            {body}
        </Link>
    ) : (
        <div className={shell}>{body}</div>
    );
}
