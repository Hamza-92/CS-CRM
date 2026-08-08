import { X } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function Modal({
    open,
    onClose,
    title,
    footer,
    children,
    width = 'md',
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    footer?: ReactNode;
    children: ReactNode;
    width?: 'sm' | 'md' | 'lg';
}) {
    const panelRef = useRef<HTMLDivElement>(null);
    const restoreRef = useRef<HTMLElement | null>(null);
    const titleId = useId();

    const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

    const trapFocus = useCallback((event: KeyboardEvent) => {
        const panel = panelRef.current;

        if (!panel || event.key !== 'Tab') {
            return;
        }

        const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
            (node) => node.offsetParent !== null,
        );

        if (nodes.length === 0) {
            return;
        }

        const first = nodes[0];
        const last = nodes[nodes.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        restoreRef.current = document.activeElement as HTMLElement | null;

        const { overflow } = document.body.style;
        document.body.style.overflow = 'hidden';

        const focusTimer = window.setTimeout(() => {
            const panel = panelRef.current;
            const target = panel?.querySelector<HTMLElement>(FOCUSABLE);
            target?.focus();
        }, 20);

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                event.stopPropagation();
                onClose();

                return;
            }

            trapFocus(event);
        }

        document.addEventListener('keydown', onKeyDown);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = overflow;
            restoreRef.current?.focus?.();
        };
    }, [open, onClose, trapFocus]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-100 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
            <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                onClick={onClose}
                className="fixed inset-0 cursor-default bg-ink/35 backdrop-blur-[2px]"
            />

            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={cn(
                    'relative my-auto w-full rounded-xl border border-line bg-surface shadow-pop',
                    widths[width],
                )}
            >
                <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-3.5">
                    <h2 id={titleId} className="text-base font-semibold tracking-tight text-ink">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close"
                        className="flex size-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"
                    >
                        <X className="size-4" />
                    </button>
                </div>

                <div className="px-5 py-4">{children}</div>

                {footer && (
                    <div className="flex items-center justify-end gap-2 border-t border-line px-5 py-3">{footer}</div>
                )}
            </div>
        </div>,
        document.body,
    );
}
