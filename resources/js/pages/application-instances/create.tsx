import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ApplicationInstanceForm } from '@/components/application-instances/application-instance-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { ProductRef, UserRef } from '@/types';

type Ref = { id: number; name: string; business?: string | null; email?: string | null };
export default function ApplicationInstanceCreate({ customers, products, owners }: { customers: Ref[]; products: ProductRef[]; owners: UserRef[] }) {
    return <AppLayout><Head title="New instance" /><PageHeader title="New instance" actions={<Link href="/instances"><Button variant="secondary"><ArrowLeft /> Back to Instances</Button></Link>} /><ApplicationInstanceForm customers={customers} products={products} owners={owners} action="/instances" method="post" submitLabel="Create instance" /></AppLayout>;
}
