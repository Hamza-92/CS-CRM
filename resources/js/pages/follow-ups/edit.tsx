import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FollowUpForm } from '@/components/follow-ups/follow-up-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { FollowUp, UserRef } from '@/types';

interface EntityOption { id: number; name: string; business: string | null; email: string | null }
interface DealOption { id: number; title: string; customer_id: number | null; lead_id: number | null }

export default function FollowUpEdit({ followUp, leads, customers, deals, owners }: { followUp: FollowUp; leads: EntityOption[]; customers: EntityOption[]; deals: DealOption[]; owners: UserRef[] }) {
    return <AppLayout><Head title={`Edit ${followUp.reason}`} /><PageHeader title="Edit follow-up" actions={<Link href="/follow-ups"><Button variant="secondary"><ArrowLeft /> Back to Follow-ups</Button></Link>} /><FollowUpForm followUp={followUp} leads={leads} customers={customers} deals={deals} owners={owners} action={`/follow-ups/${followUp.id}`} method="put" submitLabel="Save changes" /></AppLayout>;
}
