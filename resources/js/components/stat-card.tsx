import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
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

const shellTone: Record<StatTone, string> = {
    brand: 'border-brand-line/55 bg-brand-wash/55',
    ok: 'border-ok/30 bg-ok-wash/55',
    warn: 'border-warn/30 bg-warn-wash/55',
    bad: 'border-bad/30 bg-bad-wash/55',
    info: 'border-info/30 bg-info-wash/55',
    alt: 'border-alt/30 bg-alt-wash/55',
};

const hoverShadow: Record<StatTone, string> = {
    brand: '0 12px 28px -16px color-mix(in oklch, var(--brand) 42%, transparent)',
    ok: '0 12px 28px -16px color-mix(in oklch, var(--ok) 42%, transparent)',
    warn: '0 12px 28px -16px color-mix(in oklch, var(--warn) 42%, transparent)',
    bad: '0 12px 28px -16px color-mix(in oklch, var(--bad) 42%, transparent)',
    info: '0 12px 28px -16px color-mix(in oklch, var(--info) 42%, transparent)',
    alt: '0 12px 28px -16px color-mix(in oklch, var(--alt) 42%, transparent)',
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
        <div className="relative z-10">
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
        </div>
    );

    const shell = cn(
        cn('relative block rounded-xl border p-4 shadow-card transition-all duration-200 hover:-translate-y-px hover:[box-shadow:var(--stat-shadow)]', shellTone[tone]),
        href && 'cursor-pointer',
    );

    const shellStyle = { ['--stat-shadow' as string]: hoverShadow[tone] } as CSSProperties;

    return href ? (
        <Link href={href} className={shell} style={shellStyle}>
            {body}
        </Link>
    ) : (
        <div className={shell} style={shellStyle}>{body}</div>
    );
}
