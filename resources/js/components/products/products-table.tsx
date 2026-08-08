import { Link, router } from '@inertiajs/react';
import { ArchiveRestore, Archive, Eye, Pencil, Trash2, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { DataTable } from '@/components/data-table';
import type { SortDirection } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import type { Paginated, Product } from '@/types';
import { shortDate } from '@/lib/format';

const actionButton = 'flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-4';

function ProductActions({ product, archived, canEdit, canArchive }: { product: Product; archived: boolean; canEdit: boolean; canArchive: boolean }) {
    const [archiveOpen, setArchiveOpen] = useState(false);

    return (
        <>
            <div className="flex items-center justify-end gap-0.5">
                <Tooltip label="View">
                    <Link href={`/products/${product.id}`} aria-label={`View ${product.name}`} className={actionButton}><Eye /></Link>
                </Tooltip>
                {!archived && canEdit && (
                    <Tooltip label="Edit">
                        <Link href={`/products/${product.id}/edit`} aria-label={`Edit ${product.name}`} className={actionButton}><Pencil /></Link>
                    </Tooltip>
                )}
                {canArchive && (
                    archived ? (
                        <Tooltip label="Restore">
                            <button type="button" aria-label={`Restore ${product.name}`} onClick={() => router.patch(`/products/${product.id}/restore`)} className={actionButton}><ArchiveRestore /></button>
                        </Tooltip>
                    ) : (
                        <Tooltip label="Archive">
                            <button type="button" aria-label={`Archive ${product.name}`} onClick={() => setArchiveOpen(true)} className={`${actionButton} hover:bg-bad-wash hover:text-bad`}><Trash2 /></button>
                        </Tooltip>
                    )
                )}
            </div>

            <Modal
                open={archiveOpen}
                onClose={() => setArchiveOpen(false)}
                title="Archive product"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setArchiveOpen(false)}>Cancel</Button>
                        <Button variant="danger" onClick={() => { setArchiveOpen(false); router.delete(`/products/${product.id}`); }}>Archive product</Button>
                    </>
                }
            >
                <div className="flex gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-warn-wash text-warn"><TriangleAlert className="size-4" /></span>
                    <div>
                        <p className="text-xs font-medium text-ink">Archive {product.name}?</p>
                        <p className="mt-1 text-2xs leading-5 text-ink-2">The product will leave the active catalogue while its plans and history remain available.</p>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export function ProductsTable({
    products,
    archived = false,
    canEdit,
    canArchive,
    sort,
    onSortChange,
}: {
    products: Paginated<Product>;
    archived?: boolean;
    canEdit: boolean;
    canArchive: boolean;
    sort: { column: string; direction: SortDirection };
    onSortChange: (column: string, direction: SortDirection) => void;
}) {
    const columns = [
        {
            accessorKey: 'name',
            header: 'Product',
            cell: ({ row }: { row: { original: Product } }) => (
                <div className="flex items-center gap-2.5">
                    <span className="num flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-wash text-[10px] font-bold text-brand">{row.original.code.slice(0, 2)}</span>
                    <div className="min-w-0">
                        <Link href={`/products/${row.original.id}`} className="block truncate text-xs font-medium text-ink transition-colors hover:text-brand">{row.original.name}</Link>
                        <p className="truncate text-2xs text-ink-3">{row.original.description ?? row.original.code}</p>
                    </div>
                </div>
            ),
        },
        {
            accessorKey: 'code',
            header: 'Code',
            cell: ({ row }: { row: { original: Product } }) => <span className="num rounded bg-surface-3 px-1.5 py-0.5 text-2xs font-medium text-ink-2">{row.original.code}</span>,
        },
        {
            accessorKey: 'technical_owner',
            header: 'Owner',
            cell: ({ row }: { row: { original: Product } }) => row.original.technical_owner ? (
                <span className="flex items-center gap-1.5"><Avatar name={row.original.technical_owner.name} size="xs" /><span className="truncate text-xs text-ink-2">{row.original.technical_owner.name}</span></span>
            ) : <span className="text-2xs text-ink-3">Unassigned</span>,
        },
        {
            accessorKey: 'plans_count',
            header: 'Plans',
            cell: ({ row }: { row: { original: Product } }) => row.original.plans_count ? <Badge tone="info" size="sm">{row.original.plans_count}</Badge> : <span className="text-2xs text-ink-3">None</span>,
        },
        {
            accessorKey: archived ? 'deleted_at' : 'created_at',
            header: archived ? 'Archived' : 'Added',
            cell: ({ row }: { row: { original: Product } }) => <span className="num text-2xs text-ink-3">{shortDate(archived ? row.original.deleted_at : row.original.created_at)}</span>,
        },
        {
            accessorKey: 'is_active',
            header: 'Status',
            cell: ({ row }: { row: { original: Product } }) => archived ? <Badge tone="warn" size="sm">Archived</Badge> : <StatusBadge active={row.original.is_active} />,
        },
        {
            accessorKey: 'actions',
            header: 'Actions',
            cell: ({ row }: { row: { original: Product } }) => <ProductActions product={row.original} archived={archived} canEdit={canEdit} canArchive={canArchive} />,
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={products.data}
            sort={sort}
            sortableColumns={archived ? ['name', 'code', 'deleted_at'] : ['name', 'code', 'is_active', 'created_at']}
            onSortChange={onSortChange}
            getRowId={(row) => String(row.id)}
            empty={<EmptyState icon={Archive} title={archived ? 'No archived products' : 'No products yet'} description={archived ? 'Archived products will appear here.' : 'Create a product to start adding plans.'} />}
        />
    );
}
