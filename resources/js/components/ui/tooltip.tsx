import { createPortal } from 'react-dom';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, FocusEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type TooltipSide = 'top' | 'right';

type Placement = 'top' | 'right' | 'bottom' | 'left';

interface TooltipPosition {
    top: number;
    left: number;
    arrowOffset: number;
    placement: Placement;
}

const VIEWPORT_PADDING = 8;
const TOOLTIP_GAP = 8;

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
    const tooltipRef = useRef<HTMLSpanElement>(null);
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<TooltipPosition | null>(null);

    const updatePosition = useCallback(() => {
        const anchor = anchorRef.current;
        const tooltip = tooltipRef.current;

        if (!anchor || !tooltip) return;

        const anchorRect = anchor.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const requiredWidth = tooltipRect.width + TOOLTIP_GAP;
        const requiredHeight = tooltipRect.height + TOOLTIP_GAP;
        const available: Record<Placement, number> = {
            top: anchorRect.top,
            right: viewportWidth - anchorRect.right,
            bottom: viewportHeight - anchorRect.bottom,
            left: anchorRect.left,
        };
        const preferred: Placement[] = side === 'right'
            ? ['right', 'left', 'top', 'bottom']
            : ['top', 'bottom', 'left', 'right'];
        const placement = preferred.find((candidate) =>
            available[candidate] >= (candidate === 'top' || candidate === 'bottom' ? requiredHeight : requiredWidth),
        ) ?? preferred.reduce((best, candidate) => available[candidate] > available[best] ? candidate : best);

        let top = anchorRect.top;
        let left = anchorRect.left;

        if (placement === 'top') {
            top = anchorRect.top - tooltipRect.height - TOOLTIP_GAP;
            left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
        } else if (placement === 'bottom') {
            top = anchorRect.bottom + TOOLTIP_GAP;
            left = anchorRect.left + anchorRect.width / 2 - tooltipRect.width / 2;
        } else if (placement === 'right') {
            top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
            left = anchorRect.right + TOOLTIP_GAP;
        } else {
            top = anchorRect.top + anchorRect.height / 2 - tooltipRect.height / 2;
            left = anchorRect.left - tooltipRect.width - TOOLTIP_GAP;
        }

        left = Math.min(Math.max(left, VIEWPORT_PADDING), viewportWidth - tooltipRect.width - VIEWPORT_PADDING);
        top = Math.min(Math.max(top, VIEWPORT_PADDING), viewportHeight - tooltipRect.height - VIEWPORT_PADDING);

        const arrowOffset = placement === 'top' || placement === 'bottom'
            ? Math.min(Math.max(anchorRect.left + anchorRect.width / 2 - left, 10), tooltipRect.width - 10)
            : Math.min(Math.max(anchorRect.top + anchorRect.height / 2 - top, 10), tooltipRect.height - 10);

        setPosition({ top, left, arrowOffset, placement });
    }, [side]);

    useLayoutEffect(() => {
        if (!open) {
            setPosition(null);
            return;
        }

        updatePosition();
    }, [open, label, updatePosition]);

    useEffect(() => {
        if (!open) return;

        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open, updatePosition]);

    function handleBlur(event: FocusEvent<HTMLSpanElement>) {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
    }

    const arrowClass: Record<Placement, string> = {
        top: '-bottom-1',
        right: 'top-auto -left-1',
        bottom: '-top-1',
        left: 'top-auto -right-1',
    };
    const arrowStyle: CSSProperties | undefined = position
        ? position.placement === 'top' || position.placement === 'bottom'
            ? { left: position.arrowOffset - 4 }
            : { top: position.arrowOffset - 4 }
        : undefined;

    return (
        <span
            ref={anchorRef}
            className={cn('relative inline-flex', className)}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocusCapture={() => setOpen(true)}
            onBlurCapture={handleBlur}
        >
            {children}
            {open && typeof document !== 'undefined' && createPortal(
                <span
                    ref={tooltipRef}
                    role="tooltip"
                    style={position ? { top: position.top, left: position.left } : { top: -9999, left: -9999 }}
                    className={cn(
                        'pointer-events-none fixed z-[9999] rounded-md bg-brand px-2 py-1 text-2xs font-medium whitespace-nowrap text-brand-ink shadow-pop transition-[opacity,transform] duration-150',
                        position ? 'scale-100 opacity-100' : 'scale-95 opacity-0',
                    )}
                >
                    <span
                        aria-hidden="true"
                        style={arrowStyle}
                        className={cn('absolute size-2 rotate-45 rounded-[1px] bg-brand', position && arrowClass[position.placement])}
                    />
                    {label}
                </span>,
                document.body,
            )}
        </span>
    );
}
