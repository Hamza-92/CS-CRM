import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('overflow-hidden rounded-lg border border-line bg-surface shadow-card', className)}
            {...props}
        />
    );
}

export function CardHeader({
    title,
    meta,
    action,
    className,
}: {
    title: ReactNode;
    meta?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn('flex h-12 items-center justify-between gap-3 border-b border-line px-3.5', className)}>
            <div className="flex min-w-0 items-center gap-2">
                <h2 className="truncate text-xs font-semibold text-ink">{title}</h2>
                {meta && <span className="shrink-0 text-2xs text-ink-3">{meta}</span>}
            </div>
            {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
        </div>
    );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('p-3.5', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex items-center justify-end gap-2 border-t border-line bg-surface-2 px-3.5 py-2.5', className)}
            {...props}
        />
    );
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
    return (
        <section>
            <div className="mb-2 flex items-center justify-between gap-3">
                <h2 className="eyebrow text-ink-3">{title}</h2>
                {action}
            </div>
            {children}
        </section>
    );
}
