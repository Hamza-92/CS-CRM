import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Search } from 'lucide-react';
import { ProductsTable } from '@/components/products/products-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { useAuth } from '@/hooks/use-auth';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { Paginated, Product } from '@/types';

interface Props {
    products: Paginated<Product>;
    filters: { search: string; sort: string; direction: 'asc' | 'desc'; per_page: number };
}

export default function ArchivedProducts({ products, filters }: Props) {
    const { can } = useAuth();
    const { values, set, setMany } = useFilters('/products/archived', {
        search: filters.search,
        sort: filters.sort,
        direction: filters.direction,
        per_page: filters.per_page,
    });

    return (
        <AppLayout>
            <Head title="Archived products" />
            <PageHeader
                title="Archived products"
                actions={<Link href="/products"><Button variant="secondary"><ArrowLeft /> Back to Products</Button></Link>}
            />

            <Card className="mb-4 p-4">
                <div className="relative w-full max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                    <Input type="search" placeholder="Search archived products" aria-label="Search archived products" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} />
                </div>
            </Card>

            <Card>
                <ProductsTable
                    products={products}
                    archived
                    canEdit={false}
                    canArchive={can('products.archive') || can('products.manage')}
                    sort={{ column: filters.sort, direction: filters.direction }}
                    onSortChange={(column, direction) => setMany({ sort: column, direction })}
                />
                <Pagination meta={products} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} />
            </Card>
        </AppLayout>
    );
}
