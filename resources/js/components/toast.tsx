import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
    id: number;
    message: string;
    tone: ToastTone;
    duration: number;
}

interface ToastContextValue {
    toast: (message: string, tone?: ToastTone, duration?: number) => void;
    dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const styles: Record<ToastTone, { icon: typeof CheckCircle2; wrapper: string; iconWrap: string; label: string }> = {
    success: { icon: CheckCircle2, wrapper: 'border-ok/25', iconWrap: 'bg-ok-wash text-ok', label: 'Success' },
    error: { icon: AlertCircle, wrapper: 'border-bad/25', iconWrap: 'bg-bad-wash text-bad', label: 'Error' },
    warning: { icon: TriangleAlert, wrapper: 'border-warn/25', iconWrap: 'bg-warn-wash text-warn', label: 'Warning' },
    info: { icon: Info, wrapper: 'border-info/25', iconWrap: 'bg-info-wash text-info', label: 'Information' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<ToastItem[]>([]);
    const sequence = useRef(0);

    const dismiss = useCallback((id: number) => {
        setItems((current) => current.filter((item) => item.id !== id));
    }, []);

    const toast = useCallback((message: string, tone: ToastTone = 'success', duration = 5000) => {
        const id = ++sequence.current;
        setItems((current) => [...current, { id, message, tone, duration }].slice(-4));
    }, []);

    const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {typeof document !== 'undefined' && createPortal(
                <div className="pointer-events-none fixed top-4 right-4 z-[300] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite" aria-atomic="false">
                    {items.map((item) => {
                        const config = styles[item.tone];
                        const Icon = config.icon;

                        return (
                            <ToastCard key={item.id} item={item} config={config} Icon={Icon} onDismiss={dismiss} />
                        );
                    })}
                </div>,
                document.body,
            )}
        </ToastContext.Provider>
    );
}

function ToastCard({
    item,
    config,
    Icon,
    onDismiss,
}: {
    item: ToastItem;
    config: (typeof styles)[ToastTone];
    Icon: typeof CheckCircle2;
    onDismiss: (id: number) => void;
}) {
    const timerRef = useRef<number | null>(null);
    const startedAtRef = useRef(0);
    const remainingRef = useRef(item.duration);
    const [paused, setPaused] = useState(false);

    const schedule = useCallback(() => {
        if (timerRef.current) window.clearTimeout(timerRef.current);
        startedAtRef.current = Date.now();
        timerRef.current = window.setTimeout(() => onDismiss(item.id), remainingRef.current);
    }, [item.id, onDismiss]);

    useEffect(() => {
        schedule();

        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
        };
    }, [schedule]);

    function pause() {
        if (paused) return;
        if (timerRef.current) window.clearTimeout(timerRef.current);
        remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
        setPaused(true);
    }

    function resume() {
        if (!paused) return;
        setPaused(false);
        schedule();
    }

    return (
        <div
            role={item.tone === 'error' || item.tone === 'warning' ? 'alert' : 'status'}
            onMouseEnter={pause}
            onMouseLeave={resume}
            className={cn('pointer-events-auto relative flex items-start gap-3 rounded-lg border bg-surface px-3.5 py-3 shadow-pop [animation:toast-in_220ms_ease-out_both]', config.wrapper)}
        >
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', config.iconWrap)}><Icon className="size-4" /></span>
            <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-2xs font-semibold text-ink">{config.label}</p>
                <p className="mt-0.5 text-xs leading-5 text-ink-2">{item.message}</p>
            </div>
            <button type="button" aria-label="Dismiss notification" onClick={() => onDismiss(item.id)} className="flex size-6 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink"><X className="size-3.5" /></button>
            <span aria-hidden="true" className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-b-lg opacity-60', config.iconWrap.split(' ')[0])} style={{ animation: `toast-progress ${item.duration}ms linear forwards`, animationPlayState: paused ? 'paused' : 'running' }} />
        </div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) throw new Error('useToast must be used inside ToastProvider');

    return context;
}
