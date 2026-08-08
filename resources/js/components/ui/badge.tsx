import { cva, type VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const badge = cva('inline-flex items-center gap-1 rounded font-medium whitespace-nowrap', {
    variants: {
        tone: {
            neutral: 'bg-surface-3 text-ink-2',
            brand: 'bg-brand-wash text-brand',
            ok: 'bg-ok-wash text-ok',
            warn: 'bg-warn-wash text-warn',
            bad: 'bg-bad-wash text-bad',
            info: 'bg-info-wash text-info',
            alt: 'bg-alt-wash text-alt',
        },
        size: {
            sm: 'px-1.5 py-px text-2xs',
            md: 'px-2 py-0.5 text-2xs',
        },
    },
    defaultVariants: { tone: 'neutral', size: 'md' },
});

export type BadgeTone = NonNullable<VariantProps<typeof badge>['tone']>;

export function Badge({
    tone,
    size,
    dot = false,
    className,
    children,
}: VariantProps<typeof badge> & { dot?: boolean; className?: string; children: ReactNode }) {
    return (
        <span className={cn(badge({ tone, size }), className)}>
            {dot && <span className="size-1 rounded-full bg-current" aria-hidden="true" />}
            {children}
        </span>
    );
}

export function StatusDot({ tone, label }: { tone: BadgeTone; label: string }) {
    const color: Record<BadgeTone, string> = {
        neutral: 'bg-ink-3',
        brand: 'bg-brand',
        ok: 'bg-ok',
        warn: 'bg-warn',
        bad: 'bg-bad',
        info: 'bg-info',
        alt: 'bg-alt',
    };

    return (
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
            <span className={cn('size-1.5 rounded-full', color[tone])} aria-hidden="true" />
            {label}
        </span>
    );
}

export function StatusBadge({ active }: { active: boolean }) {
    return <StatusDot tone={active ? 'ok' : 'neutral'} label={active ? 'Active' : 'Inactive'} />;
}
