import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { CustomerForm } from '@/components/customers/customer-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Customer, UserRef } from '@/types';

export default function CustomerEdit({ customer, owners }: { customer: Customer; owners: UserRef[] }) { return <AppLayout><Head title={`Edit ${customer.name}`} /><PageHeader title="Edit customer" actions={<Link href={`/customers/${customer.id}`}><Button variant="secondary"><ArrowLeft /> Back to Customer</Button></Link>} /><CustomerForm customer={customer} owners={owners} action={`/customers/${customer.id}`} method="put" submitLabel="Save changes" /></AppLayout>; }
