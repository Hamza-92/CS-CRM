import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TooltipSide = 'top' | 'right';

export function Tooltip({
    label,
    side = 'top',
    children,
    className,
}: {
    label: string;
    side?: TooltipSide;
    children: ReactNode;
    className?: string;
}) {
    const position =
        side === 'right'
            ? 'top-1/2 left-full ml-2.5 -translate-y-1/2 origin-left'
            : 'bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom';

    const notch =
        side === 'right'
            ? 'top-1/2 -left-1 -translate-y-1/2'
            : '-bottom-1 left-1/2 -translate-x-1/2';

    return (
        <span className={cn('group/tip relative inline-flex', className)}>
            {children}
            <span
                role="tooltip"
                className={cn(
                    'pointer-events-none absolute z-60 scale-90 rounded-md bg-brand px-2 py-1 text-2xs font-medium whitespace-nowrap text-brand-ink opacity-0 shadow-pop transition-all duration-150 group-hover/tip:scale-100 group-hover/tip:opacity-100 group-focus-within/tip:scale-100 group-focus-within/tip:opacity-100',
                    position,
                )}
            >
                <span aria-hidden="true" className={cn('absolute size-2 rotate-45 rounded-[1px] bg-brand', notch)} />
                {label}
            </span>
        </span>
    );
}
