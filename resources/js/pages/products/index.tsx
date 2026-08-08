import { Head, Link } from '@inertiajs/react';
import { Boxes, Plus, Search } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { EmptyState } from '@/components/empty-state';
import { PageHeader, Toolbar } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/field';
import { useAuth } from '@/hooks/use-auth';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { Paginated, Product } from '@/types';
import { shortDate } from '@/lib/format';

interface Props {
    products: Paginated<Product>;
    filters: {
        search: string;
        status: string;
        archived: boolean;
        sort: string;
        direction: 'asc' | 'desc';
    };
}

const columns = [
    {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }: { row: { original: Product } }) => (
            <div className="flex items-center gap-2.5">
                <span className="num flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-wash text-[10px] font-bold text-brand">
                    {row.original.code.slice(0, 2)}
                </span>
                <div className="min-w-0">
                    <Link
                        href={`/products/${row.original.id}`}
                        className="block truncate text-xs font-medium text-ink transition-colors hover:text-brand"
                    >
                        {row.original.name}
                    </Link>
                    <p className="truncate text-2xs text-ink-3">{row.original.description ?? row.original.code}</p>
                </div>
            </div>
        ),
    },
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }: { row: { original: Product } }) => (
            <span className="num rounded bg-surface-3 px-1.5 py-0.5 text-2xs font-medium text-ink-2">
                {row.original.code}
            </span>
        ),
    },
    {
        accessorKey: 'technical_owner',
        header: 'Owner',
        cell: ({ row }: { row: { original: Product } }) =>
            row.original.technical_owner ? (
                <span className="flex items-center gap-1.5">
                    <Avatar name={row.original.technical_owner.name} size="xs" />
                    <span className="truncate text-xs text-ink-2">{row.original.technical_owner.name}</span>
                </span>
            ) : (
                <span className="text-2xs text-ink-3">Unassigned</span>
            ),
    },
    {
        accessorKey: 'plans_count',
        header: 'Plans',
        cell: ({ row }: { row: { original: Product } }) =>
            row.original.plans_count ? (
                <Badge tone="info" size="sm">
                    {row.original.plans_count}
                </Badge>
            ) : (
                <span className="text-2xs text-ink-3">None</span>
            ),
    },
    {
        accessorKey: 'created_at',
        header: 'Added',
        cell: ({ row }: { row: { original: Product } }) => (
            <span className="num text-2xs text-ink-3">{shortDate(row.original.created_at)}</span>
        ),
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }: { row: { original: Product } }) =>
            row.original.deleted_at ? (
                <Badge tone="warn" size="sm">
                    Archived
                </Badge>
            ) : (
                <StatusBadge active={row.original.is_active} />
            ),
    },
];

export default function ProductsIndex({ products, filters }: Props) {
    const { can } = useAuth();
    const { values, set, setMany } = useFilters('/products', {
        search: filters.search,
        status: filters.status,
        archived: filters.archived,
        sort: filters.sort,
        direction: filters.direction,
    });

    return (
        <AppLayout>
            <Head title="Products" />

            <PageHeader
                title="Products"
                badge={
                    <Badge tone="neutral" size="sm">
                        {products.total}
                    </Badge>
                }
                actions={
                    can('products.manage') && (
                        <Link href="/products/create">
                            <Button>
                                <Plus />
                                New product
                            </Button>
                        </Link>
                    )
                }
            />

            <Card>
                <Toolbar>
                    <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                        <Input
                            type="search"
                            placeholder="Search products"
                            aria-label="Search products"
                            className="pl-8"
                            value={values.search ?? ''}
                            onChange={(event) => set('search', event.target.value, 300)}
                        />
                    </div>
                    <Select
                        aria-label="Filter by status"
                        className="w-auto"
                        value={values.status ?? ''}
                        onChange={(event) => set('status', event.target.value)}
                    >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                    <Select
                        aria-label="Filter archived"
                        className="w-auto"
                        value={values.archived ? 'archived' : ''}
                        onChange={(event) => set('archived', event.target.value === 'archived')}
                    >
                        <option value="">Current</option>
                        <option value="archived">Archived</option>
                    </Select>
                </Toolbar>

                <DataTable
                    columns={columns}
                    data={products.data}
                    sort={{ column: filters.sort, direction: filters.direction }}
                    sortableColumns={['name', 'code', 'is_active', 'created_at']}
                    onSortChange={(column, direction) => setMany({ sort: column, direction })}
                    getRowId={(row) => String(row.id)}
                    empty={
                        <EmptyState
                            icon={Boxes}
                            title={values.search ? 'No matches' : 'No products yet'}
                            description={
                                values.search ? 'Try a different search term.' : 'Create a product to start adding plans.'
                            }
                            action={
                                can('products.manage') &&
                                !values.search && (
                                    <Link href="/products/create">
                                        <Button size="sm">
                                            <Plus />
                                            New product
                                        </Button>
                                    </Link>
                                )
                            }
                        />
                    }
                />

                <Pagination meta={products} />
            </Card>
        </AppLayout>
    );
}
