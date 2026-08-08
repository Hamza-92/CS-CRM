import { Link } from '@inertiajs/react';
import type { Paginated } from '@/types';
import { cn } from '@/lib/utils';

export function Pagination<T>({ meta }: { meta: Paginated<T> }) {
    if (meta.total === 0) {
        return null;
    }

    return (
        <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-2 px-3.5 py-2"
        >
            <p className="text-2xs text-ink-3">
                <span className="num font-medium text-ink-2">{meta.from ?? 0}</span>–
                <span className="num font-medium text-ink-2">{meta.to ?? 0}</span> of{' '}
                <span className="num font-medium text-ink-2">{meta.total}</span>
            </p>

            {meta.last_page > 1 && (
                <div className="flex flex-wrap items-center gap-0.5">
                    {meta.links.map((link, index) =>
                        link.url ? (
                            <Link
                                key={index}
                                href={link.url}
                                preserveScroll
                                preserveState
                                aria-current={link.active ? 'page' : undefined}
                                className={cn(
                                    'num inline-flex h-7 min-w-7 items-center justify-center rounded px-2 text-2xs font-medium transition-colors',
                                    link.active
                                        ? 'bg-brand text-brand-ink'
                                        : 'text-ink-2 hover:bg-surface-3 hover:text-ink',
                                )}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={index}
                                className="inline-flex h-7 min-w-7 items-center justify-center rounded px-2 text-2xs text-ink-3/60"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </div>
            )}
        </nav>
    );
}
