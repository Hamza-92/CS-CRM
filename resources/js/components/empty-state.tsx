import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
}: {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-2.5 py-4 text-center">
            {Icon && (
                <div className="flex size-9 items-center justify-center rounded-lg border border-line bg-surface-2">
                    <Icon className="size-4 text-ink-3" />
                </div>
            )}
            <div>
                <p className="text-xs font-medium text-ink">{title}</p>
                {description && <p className="mt-0.5 max-w-sm text-2xs text-ink-3">{description}</p>}
            </div>
            {action}
        </div>
    );
}
