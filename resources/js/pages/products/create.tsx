import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { ProductForm } from '@/components/products/product-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { RoleRef, UserRef } from '@/types';

export default function ProductCreate({ owners, roles }: { owners: UserRef[]; roles: RoleRef[] }) {
    return (
        <AppLayout>
            <Head title="New product" />

            <PageHeader
                title="New product"
                actions={<Button variant="secondary" onClick={() => router.visit('/products')}><ArrowLeft /> Back to Products</Button>}
            />

            <div className="w-full">
                <ProductForm owners={owners} roles={roles} action="/products" method="post" submitLabel="Create product" />
            </div>
        </AppLayout>
    );
}
