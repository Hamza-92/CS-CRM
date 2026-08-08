import { Head, Link } from '@inertiajs/react';
import { Archive, Plus, Search } from 'lucide-react';
import { ProductsTable } from '@/components/products/products-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/hooks/use-auth';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { Paginated, Product } from '@/types';

interface Props {
    products: Paginated<Product>;
    filters: { search: string; status: string; sort: string; direction: 'asc' | 'desc'; per_page: number };
}

export default function ProductsIndex({ products, filters }: Props) {
    const { can } = useAuth();
    const { values, set, setMany } = useFilters('/products', {
        search: filters.search,
        status: filters.status,
        sort: filters.sort,
        direction: filters.direction,
        per_page: filters.per_page,
    });
    const hasFilters = Boolean(values.search || values.status);

    return (
        <AppLayout>
            <Head title="Products" />
            <PageHeader
                title="Products"
                badge={<Badge tone="neutral" size="sm">{products.total}</Badge>}
                actions={
                    <div className="flex items-center gap-2">
                        {(can('products.archive') || can('products.manage')) && (
                            <Link href="/products/archived"><Button variant="secondary"><Archive /> Archived products</Button></Link>
                        )}
                        {(can('products.create') || can('products.manage')) && (
                            <Link href="/products/create"><Button><Plus /> New product</Button></Link>
                        )}
                    </div>
                }
            />

            <Card className="mb-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                        <Input type="search" placeholder="Search products" aria-label="Search products" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} />
                    </div>
                    <div className="w-36">
                        <SearchableSelect
                            options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                            value={values.status ?? ''}
                            onChange={(value) => set('status', value)}
                            placeholder="All statuses"
                            searchPlaceholder="Search statuses..."
                        />
                    </div>
                    {hasFilters && <button type="button" onClick={() => setMany({ search: '', status: '' })} className="text-xs font-medium text-brand hover:underline">Clear filters</button>}
                </div>
            </Card>

            <Card>
                <ProductsTable
                    products={products}
                    canEdit={can('products.edit') || can('products.manage')}
                    canArchive={can('products.archive') || can('products.manage')}
                    sort={{ column: filters.sort, direction: filters.direction }}
                    onSortChange={(column, direction) => setMany({ sort: column, direction })}
                />
                <Pagination meta={products} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} />
            </Card>
        </AppLayout>
    );
}
