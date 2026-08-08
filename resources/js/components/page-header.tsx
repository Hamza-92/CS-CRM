import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

export interface Crumb {
    label: string;
    href?: string;
}

export function PageHeader({
    title,
    badge,
    description,
    breadcrumbs = [],
    actions,
}: {
    title: string;
    badge?: ReactNode;
    description?: string;
    breadcrumbs?: Crumb[];
    actions?: ReactNode;
}) {
    return (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
                {breadcrumbs.length > 0 && (
                    <nav aria-label="Breadcrumb" className="mb-1">
                        <ol className="flex flex-wrap items-center gap-0.5 text-2xs text-ink-3">
                            {breadcrumbs.map((crumb, index) => (
                                <li key={index} className="flex items-center gap-0.5">
                                    {index > 0 && <ChevronRight className="size-2.5" />}
                                    {crumb.href ? (
                                        <Link href={crumb.href} className="transition-colors hover:text-ink">
                                            {crumb.label}
                                        </Link>
                                    ) : (
                                        <span className="text-ink-2">{crumb.label}</span>
                                    )}
                                </li>
                            ))}
                        </ol>
                    </nav>
                )}
                <div className="flex items-center gap-2">
                    <h1 className="truncate text-xl font-semibold text-ink">{title}</h1>
                    {badge}
                </div>
                {description && <p className="mt-1.5 max-w-2xl text-xs text-ink-2">{description}</p>}
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
    );
}

export function Toolbar({ children }: { children: ReactNode }) {
    return <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2.5">{children}</div>;
}
