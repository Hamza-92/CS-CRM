import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { LeadForm } from '@/components/leads/lead-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { ProductRef, UserRef } from '@/types';
import { Link } from '@inertiajs/react';

export default function LeadCreate({ owners, products, statuses, sources }: { owners: UserRef[]; products: ProductRef[]; statuses: { value: string; label: string }[]; sources: { value: string; label: string }[] }) { const defaultStatus = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('status') ?? undefined : undefined; return <AppLayout><Head title="New lead" /><PageHeader title="New lead" actions={<Link href="/leads"><Button variant="secondary"><ArrowLeft /> Back to Leads</Button></Link>} /><LeadForm owners={owners} products={products} statuses={statuses} sources={sources} defaultStatus={defaultStatus} action="/leads" method="post" submitLabel="Create lead" /></AppLayout>; }
