import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FollowUpForm } from '@/components/follow-ups/follow-up-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { UserRef } from '@/types';

interface EntityOption { id: number; name: string; business: string | null; email: string | null }
interface DealOption { id: number; title: string; customer_id: number | null; lead_id: number | null }
interface InstanceOption { id: number; name: string; customer_id: number; product_id: number }

export default function FollowUpCreate({ leads, customers, deals, instances, owners }: { leads: EntityOption[]; customers: EntityOption[]; deals: DealOption[]; instances: InstanceOption[]; owners: UserRef[] }) {
    return <AppLayout><Head title="New follow-up" /><PageHeader title="New follow-up" actions={<Link href="/follow-ups"><Button variant="secondary"><ArrowLeft /> Back to Follow-ups</Button></Link>} /><FollowUpForm leads={leads} customers={customers} deals={deals} instances={instances} owners={owners} action="/follow-ups" method="post" submitLabel="Create follow-up" /></AppLayout>;
}
