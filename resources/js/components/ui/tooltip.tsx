import { type ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
    const anchorRef = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

    useEffect(() => {
        if (!open) return;

        function updatePosition() {
            const rect = anchorRef.current?.getBoundingClientRect();
            if (!rect) return;

            setPosition(
                side === 'right'
                    ? { left: rect.right + 10, top: rect.top + rect.height / 2 }
                    : { left: rect.left + rect.width / 2, top: rect.top - 8 },
            );
        }

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, side]);

    const positionClass = side === 'right'
        ? '-translate-y-1/2'
        : '-translate-x-1/2 -translate-y-full';
    const notchClass = side === 'right'
        ? 'top-1/2 -left-1 -translate-y-1/2'
        : '-bottom-1 left-1/2 -translate-x-1/2';

    return (
        <span
            ref={anchorRef}
            className={cn('group/tip relative inline-flex', className)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            {children}
            {open && position && typeof document !== 'undefined' && createPortal(
                <span
                    role="tooltip"
                    className={cn('pointer-events-none fixed z-[200] rounded-md bg-brand px-2 py-1 text-2xs font-medium whitespace-nowrap text-brand-ink shadow-pop', positionClass)}
                    style={{ left: position.left, top: position.top }}
                >
                    <span aria-hidden="true" className={cn('absolute size-2 rotate-45 rounded-[1px] bg-brand', notchClass)} />
                    {label}
                </span>,
                document.body,
            )}
        </span>
    );
}
