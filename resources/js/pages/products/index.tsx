import { Head, Link, router } from '@inertiajs/react';
import { Archive, FileDown, FileUp, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { useRef, useState } from 'react';
import { ProductsGrid, ProductsTable } from '@/components/products/products-table';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { useAuth } from '@/hooks/use-auth';
import { useFilters } from '@/hooks/use-filters';
import { usePersistedState } from '@/hooks/use-persisted-state';
import AppLayout from '@/layouts/app-layout';
import type { Paginated, Product } from '@/types';
import { cn } from '@/lib/utils';

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
    const [activeView, setActiveView] = usePersistedState<'list' | 'grid'>('crm.products.view', 'list');
    const importRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const exportParams = new URLSearchParams();
    if (values.search) exportParams.set('search', String(values.search));
    if (values.status) exportParams.set('status', String(values.status));
    const exportHref = `/products/export${exportParams.toString() ? `?${exportParams.toString()}` : ''}`;

    function importProducts(file: File | undefined) {
        if (!file) return;

        const form = new FormData();
        form.append('file', file);
        setImporting(true);
        router.post('/products/import', form, {
            forceFormData: true,
            preserveScroll: true,
            onFinish: () => setImporting(false),
        });
    }

    return (
        <AppLayout>
            <Head title="Products" />
            <PageHeader
                title="Products"
                badge={<Badge tone="neutral" size="sm">{products.total}</Badge>}
                actions={
                    <div className="flex items-center gap-2">
                        <a href={exportHref} download="products.csv" aria-label="Export products" className={buttonVariants({ variant: 'secondary' })}>
                            <FileDown />
                            Export
                        </a>
                        {(can('products.create') || can('products.manage')) && (
                            <Button variant="secondary" disabled={importing} onClick={() => importRef.current?.click()}>
                                <FileUp />
                                Import
                            </Button>
                        )}
                        {(can('products.archive') || can('products.manage')) && (
                            <Link href="/products/archived"><Button variant="secondary"><Archive /> Archived products</Button></Link>
                        )}
                        {(can('products.create') || can('products.manage')) && (
                            <Link href="/products/create"><Button><Plus /> New product</Button></Link>
                        )}
                    </div>
                }
            />
            <input
                ref={importRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(event) => {
                    importProducts(event.target.files?.[0]);
                    event.currentTarget.value = '';
                }}
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
                        canEdit={can('products.edit') || can('products.manage')}
                        canArchive={can('products.archive') || can('products.manage')}
                        sort={{ column: filters.sort, direction: filters.direction }}
                        onSortChange={(column, direction) => setMany({ sort: column, direction })}
                    />
                    <Pagination meta={products} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} />
                </Card>
            ) : (
                <div>
                    <ProductsGrid products={products} canEdit={can('products.edit') || can('products.manage')} canArchive={can('products.archive') || can('products.manage')} />
                    <Card className="mt-4"><Pagination meta={products} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card>
                </div>
            )}
        </AppLayout>
    );
}
