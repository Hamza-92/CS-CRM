import { Head } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { LeadForm } from '@/components/leads/lead-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Lead, ProductRef, UserRef } from '@/types';
import { Link } from '@inertiajs/react';

export default function LeadEdit({ lead, owners, products, statuses, sources }: { lead: Lead; owners: UserRef[]; products: ProductRef[]; statuses: { value: string; label: string }[]; sources: { value: string; label: string }[] }) { return <AppLayout><Head title={`Edit ${lead.name}`} /><PageHeader title="Edit lead" actions={<Link href={`/leads/${lead.id}`}><Button variant="secondary"><ArrowLeft /> Back to Lead</Button></Link>} /><LeadForm lead={lead} owners={owners} products={products} statuses={statuses} sources={sources} action={`/leads/${lead.id}`} method="put" submitLabel="Save changes" /></AppLayout>; }
