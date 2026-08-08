import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { ProductForm } from '@/components/products/product-form';
import AppLayout from '@/layouts/app-layout';
import type { RoleRef, UserRef } from '@/types';

export default function ProductCreate({ owners, roles }: { owners: UserRef[]; roles: RoleRef[] }) {
    return (
        <AppLayout>
            <Head title="New product" />

            <PageHeader
                title="New product"
                breadcrumbs={[{ label: 'Products', href: '/products' }, { label: 'New' }]}
            />

            <div className="max-w-3xl">
                <ProductForm owners={owners} roles={roles} action="/products" method="post" submitLabel="Create product" />
            </div>
        </AppLayout>
    );
}
