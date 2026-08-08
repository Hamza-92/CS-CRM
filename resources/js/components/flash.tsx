import { usePage } from '@inertiajs/react';
import { CircleAlert, CircleCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { SharedProps } from '@/types';
import { cn } from '@/lib/utils';

export function Flash() {
    const { flash } = usePage<SharedProps>().props;
    const [dismissed, setDismissed] = useState<string | null>(null);

    const message = flash.success ?? flash.error;
    const ok = Boolean(flash.success);

    useEffect(() => {
        setDismissed(null);
    }, [message]);

    if (!message || dismissed === message) {
        return null;
    }

    const Icon = ok ? CircleCheck : CircleAlert;

    return (
        <div
            role="status"
            aria-live="polite"
            className={cn(
                'mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-xs shadow-card',
                ok ? 'border-ok/20 bg-ok-wash text-ok' : 'border-bad/20 bg-bad-wash text-bad',
            )}
        >
            <Icon className="size-3.5 shrink-0" />
            <p className="flex-1 font-medium">{message}</p>
            <button
                type="button"
                onClick={() => setDismissed(message)}
                aria-label="Dismiss notification"
                className="shrink-0 opacity-50 transition-opacity hover:opacity-100"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}
