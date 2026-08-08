import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ApplicationInstanceForm } from '@/components/application-instances/application-instance-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { ApplicationInstance, ProductRef, UserRef } from '@/types';

type Ref = { id: number; name: string; business?: string | null; email?: string | null };
export default function ApplicationInstanceEdit({ instance, customers, products, owners }: { instance: ApplicationInstance; customers: Ref[]; products: ProductRef[]; owners: UserRef[] }) {
    return <AppLayout><Head title={`Edit ${instance.name}`} /><PageHeader title="Edit instance" actions={<Link href={`/instances/${instance.id}`}><Button variant="secondary"><ArrowLeft /> Back to instance</Button></Link>} /><ApplicationInstanceForm instance={instance} customers={customers} products={products} owners={owners} action={`/instances/${instance.id}`} method="put" submitLabel="Save changes" /></AppLayout>;
}
