import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';
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

const featuredTone: Record<StatTone, string> = {
    brand: 'border-brand-line/70 bg-brand-wash/58',
    ok: 'border-ok/35 bg-ok-wash/58',
    warn: 'border-warn/35 bg-warn-wash/58',
    bad: 'border-bad/35 bg-bad-wash/58',
    info: 'border-info/35 bg-info-wash/58',
    alt: 'border-alt/35 bg-alt-wash/58',
};

const hoverShadow: Record<StatTone, string> = {
    brand: '0 12px 28px -16px color-mix(in oklch, var(--brand) 42%, transparent)',
    ok: '0 12px 28px -16px color-mix(in oklch, var(--ok) 42%, transparent)',
    warn: '0 12px 28px -16px color-mix(in oklch, var(--warn) 42%, transparent)',
    bad: '0 12px 28px -16px color-mix(in oklch, var(--bad) 42%, transparent)',
    info: '0 12px 28px -16px color-mix(in oklch, var(--info) 42%, transparent)',
    alt: '0 12px 28px -16px color-mix(in oklch, var(--alt) 42%, transparent)',
};

const toneVariable: Record<StatTone, string> = {
    brand: 'var(--brand)',
    ok: 'var(--ok)',
    warn: 'var(--warn)',
    bad: 'var(--bad)',
    info: 'var(--info)',
    alt: 'var(--alt)',
};

const featuredCaption: Record<string, string> = {
    'Open pipeline': 'Active opportunity value',
    'Weighted forecast': 'Probability-adjusted value',
    'Closing this month': 'Deals due this month',
    'Won this month': 'Closed successfully',
    Today: 'Due before midnight',
    Overdue: 'Needs attention',
    'Open follow-ups': 'Pending completion',
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
    variant = 'default',
}: {
    label: string;
    value: string | number;
    icon: LucideIcon;
    tone?: StatTone;
    delta?: number;
    caption?: string;
    trend?: number[];
    href?: string;
    variant?: 'default' | 'featured';
}) {
    const resolvedCaption = caption ?? featuredCaption[label];
    const isFeatured = variant === 'featured' || label in featuredCaption;

    if (isFeatured) {
        const featuredStyle = {
            ['--stat-color' as string]: toneVariable[tone],
            ['--stat-shadow' as string]: hoverShadow[tone],
            boxShadow: '0 2px 5px -3px color-mix(in oklch, var(--stat-color) 35%, transparent)',
        } as CSSProperties;
        const featuredBody = (
            <>
                <span
                    aria-hidden="true"
                    className="absolute -top-4 -right-4 size-20 rounded-full bg-[color-mix(in_oklch,var(--stat-color)_9%,transparent)] transition-transform duration-500 ease-out group-hover:scale-110"
                >
                    <ArrowUpRight className="absolute top-7 right-7 size-3.5 text-[color-mix(in_oklch,var(--stat-color)_48%,transparent)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--stat-color)]" strokeWidth={1.7} />
                </span>
                <div className="relative z-10 flex h-full flex-col items-start">
                    <span
                        className={cn(
                            'flex size-9 items-center justify-center rounded-lg transition-all duration-300 group-hover:-translate-y-0.5 group-hover:scale-105',
                            chip[tone],
                        )}
                        style={{ backgroundColor: 'color-mix(in oklch, var(--stat-color) 13%, transparent)' }}
                    >
                        <Icon className="size-4" strokeWidth={1.9} />
                    </span>

                    <p className="mt-3 truncate text-2xs font-medium text-[var(--stat-color)]">{label}</p>
                    <p
                        className="num mt-1.5 truncate text-[clamp(1.2rem,2vw,1.4rem)] leading-none font-semibold tracking-[-0.02em]"
                        style={{ color: 'color-mix(in oklch, var(--stat-color) 48%, var(--ink))' }}
                    >
                        {value}
                    </p>

                    {(resolvedCaption || delta !== undefined) && (
                        <div className="mt-2 flex min-w-0 items-center gap-2 text-[10px] font-medium text-[var(--stat-color)]">
                            {resolvedCaption && <p className="truncate">{resolvedCaption}</p>}
                            {delta !== undefined && <span className="num">{delta >= 0 ? '+' : ''}{delta}%</span>}
                        </div>
                    )}
                </div>
            </>
        );
        const featuredShell = cn(
            'group relative isolate block min-h-[142px] overflow-hidden rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:[box-shadow:var(--stat-shadow)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
            featuredTone[tone],
            href && 'cursor-pointer',
        );

        return href ? (
            <Link href={href} className={featuredShell} style={featuredStyle}>
                {featuredBody}
            </Link>
        ) : (
            <div className={featuredShell} style={featuredStyle}>{featuredBody}</div>
        );
    }

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
