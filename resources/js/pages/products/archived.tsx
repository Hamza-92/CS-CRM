import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileDown, LayoutGrid, List, Search } from 'lucide-react';
import { ProductsGrid, ProductsTable } from '@/components/products/products-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { useAuth } from '@/hooks/use-auth';
import { useFilters } from '@/hooks/use-filters';
import { usePersistedState } from '@/hooks/use-persisted-state';
import AppLayout from '@/layouts/app-layout';
import type { Paginated, Product } from '@/types';
import { cn } from '@/lib/utils';

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
    const exportQuery = values.search ? `?archived=1&search=${encodeURIComponent(String(values.search))}` : '?archived=1';
    const [activeView, setActiveView] = usePersistedState<'list' | 'grid'>('crm.products.archived.view', 'list');

    return (
        <AppLayout>
            <Head title="Archived products" />
            <PageHeader
                title="Archived products"
                actions={
                    <div className="flex items-center gap-2">
                        <a href={`/products/export${exportQuery}`} download="archived-products.csv" aria-label="Export archived products" className={buttonVariants({ variant: 'secondary' })}>
                            <FileDown />
                            Export
                        </a>
                        <Link href="/products"><Button variant="secondary"><ArrowLeft /> Back to Products</Button></Link>
                    </div>
                }
            />

            <Card className="mb-4 p-4">
                <div className="flex items-center gap-2">
                    <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                        <Input type="search" placeholder="Search archived products" aria-label="Search archived products" className="pl-8" value={values.search ?? ''} onChange={(event) => set('search', event.target.value, 300)} />
                    </div>
                    <div className="ml-auto flex rounded-md border border-line bg-surface p-0.5">
                        <button type="button" aria-label="List view" onClick={() => setActiveView('list')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', activeView === 'list' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><List className="size-4" /></button>
                        <button type="button" aria-label="Grid view" onClick={() => setActiveView('grid')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', activeView === 'grid' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><LayoutGrid className="size-4" /></button>
                    </div>
                </div>
            </Card>

            {activeView === 'list' ? (
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
            ) : (
                <div>
                    <ProductsGrid products={products} archived canEdit={false} canArchive={can('products.archive') || can('products.manage')} />
                    <Card className="mt-4"><Pagination meta={products} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card>
                </div>
            )}
        </AppLayout>
    );
}
