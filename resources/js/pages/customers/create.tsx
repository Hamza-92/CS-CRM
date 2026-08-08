import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { CustomerForm } from '@/components/customers/customer-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { UserRef } from '@/types';

export default function CustomerCreate({ owners }: { owners: UserRef[] }) { return <AppLayout><Head title="New customer" /><PageHeader title="New customer" actions={<Link href="/customers"><Button variant="secondary"><ArrowLeft /> Back to Customers</Button></Link>} /><CustomerForm owners={owners} action="/customers" method="post" submitLabel="Create customer" /></AppLayout>; }
