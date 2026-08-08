import { tableFeatures, useTable } from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const features = tableFeatures({});

export type SortDirection = 'asc' | 'desc';

export interface DataTableSort {
    column: string;
    direction: SortDirection;
}

interface DataTableProps<TData extends object> {
    columns: Array<Record<string, unknown>>;
    data: TData[];
    sort?: DataTableSort;
    sortableColumns?: string[];
    onSortChange?: (column: string, direction: SortDirection) => void;
    empty?: ReactNode;
    getRowId?: (row: TData, index: number) => string;
    rowHref?: (row: TData) => string | undefined;
}

export function DataTable<TData extends object>({
    columns,
    data,
    sort,
    sortableColumns = [],
    onSortChange,
    empty,
    getRowId,
}: DataTableProps<TData>) {
    const table = useTable({
        features,
        columns: columns as never,
        data,
        getRowId: getRowId as never,
    });

    const rows = table.getRowModel().rows;

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead className="bg-[#F0F0F1]">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-line">
                            {headerGroup.headers.map((header) => {
                                const id = header.column.id;
                                const sortable = sortableColumns.includes(id) && Boolean(onSortChange);
                                const isSorted = sort?.column === id;

                                return (
                                    <th
                                        key={header.id}
                                        scope="col"
                                        className="h-10 px-3 text-left align-middle first:pl-3.5 last:pr-3.5"
                                        aria-sort={
                                            isSorted ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined
                                        }
                                    >
                                        {sortable ? (
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onSortChange?.(id, isSorted && sort.direction === 'asc' ? 'desc' : 'asc')
                                                }
                                                className={cn(
                                                    'inline-flex items-center gap-1 text-xs font-semibold transition-colors',
                                                    isSorted ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                                                )}
                                            >
                                                <table.FlexRender header={header} />
                                                {isSorted ? (
                                                    sort.direction === 'asc' ? (
                                                        <ChevronUp className="size-3" />
                                                    ) : (
                                                        <ChevronDown className="size-3" />
                                                    )
                                                ) : (
                                                    <ChevronsUpDown className="size-3 opacity-40" />
                                                )}
                                            </button>
                                        ) : (
                                                    <span className="text-xs font-semibold text-ink-2">
                                                <table.FlexRender header={header} />
                                            </span>
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={table.getAllLeafColumns().length} className="px-3.5 py-10">
                                {empty}
                            </td>
                        </tr>
                    ) : (
                        rows.map((row) => (
                            <tr
                                key={row.id}
                                className="border-b border-line/70 transition-colors last:border-b-0 hover:bg-surface-2"
                            >
                                {row.getAllCells().map((cell) => (
                                    <td
                                        key={cell.id}
                                        className="h-[60px] px-3 align-middle text-xs text-ink-2 first:pl-3.5 last:pr-3.5"
                                    >
                                        <table.FlexRender cell={cell} />
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
