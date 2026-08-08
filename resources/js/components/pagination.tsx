import { Link } from '@inertiajs/react';
import type { Paginated } from '@/types';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/ui/searchable-select';

export function Pagination<T>({
    meta,
    perPage,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
}: {
    meta: Paginated<T>;
    perPage?: number;
    onPerPageChange?: (value: number) => void;
    perPageOptions?: number[];
}) {
    if (meta.total === 0) return null;

    return (
        <nav aria-label="Pagination" className="grid gap-3 border-t border-line bg-surface px-4 py-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <p className="text-xs text-ink-2">
                Showing <span className="num">{meta.from ?? 0}</span> to <span className="num">{meta.to ?? 0}</span> of{' '}
                <span className="num">{meta.total}</span> results
            </p>

            {meta.last_page > 1 && perPage !== undefined && onPerPageChange && (
                <label className="flex items-center gap-3 text-xs font-medium text-ink-2 md:justify-self-center">
                    Rows per page:
                    <div className="w-20">
                        <SearchableSelect
                            options={perPageOptions.map((option) => ({ value: String(option), label: String(option) }))}
                            value={String(perPage)}
                            onChange={(value) => onPerPageChange(Number(value))}
                            placeholder={String(perPage)}
                            searchPlaceholder="Rows..."
                        />
                    </div>
                </label>
            )}

            {meta.last_page > 1 && (
                <div className="flex flex-wrap items-center gap-1 md:justify-self-end">
                    {meta.links.map((link, index) => link.url ? (
                        <Link
                            key={index}
                            href={link.url}
                            preserveScroll
                            preserveState
                            aria-current={link.active ? 'page' : undefined}
                            className={cn(
                                'num inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-xs font-medium shadow-card transition-colors',
                                link.active
                                    ? 'border-brand bg-brand text-brand-ink'
                                    : 'border-line bg-surface text-ink-2 hover:bg-surface-3 hover:text-ink',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : (
                        <span
                            key={index}
                            className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line bg-surface px-3 text-xs text-ink-3/60"
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </div>
            )}
        </nav>
    );
}
