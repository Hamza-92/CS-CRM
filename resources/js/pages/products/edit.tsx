import { Head } from '@inertiajs/react';
import { PageHeader } from '@/components/page-header';
import { ProductForm } from '@/components/products/product-form';
import AppLayout from '@/layouts/app-layout';
import type { Product, RoleRef, UserRef } from '@/types';

export default function ProductEdit({
    product,
    owners,
    roles,
}: {
    product: Product;
    owners: UserRef[];
    roles: RoleRef[];
}) {
    return (
        <AppLayout>
            <Head title={`Edit ${product.name}`} />

            <PageHeader
                title={`Edit ${product.name}`}
                breadcrumbs={[
                    { label: 'Products', href: '/products' },
                    { label: product.name, href: `/products/${product.id}` },
                    { label: 'Edit' },
                ]}
            />

            <div className="max-w-3xl">
                <ProductForm
                    product={product}
                    owners={owners}
                    roles={roles}
                    action={`/products/${product.id}`}
                    method="put"
                    submitLabel="Save changes"
                />
            </div>
        </AppLayout>
    );
}
