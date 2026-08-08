import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { ProductForm } from '@/components/products/product-form';
import { Button } from '@/components/ui/button';
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
                actions={<Button variant="secondary" onClick={() => router.visit(`/products/${product.id}`)}><ArrowLeft /> Back to Product</Button>}
            />

            <div className="w-full">
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
