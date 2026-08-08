import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { SubscriptionForm } from '@/components/subscriptions/subscription-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Plan } from '@/types';

type InstanceOption = { id: number; name: string; customer?: { name: string; business?: string | null } | null; product?: { name: string; code: string } | null; environment?: string; status?: string };
export default function SubscriptionCreate({ instances, plans }: { instances: InstanceOption[]; plans: Plan[] }) { return <AppLayout><Head title="New subscription" /><PageHeader title="New subscription" actions={<Link href="/subscriptions"><Button variant="secondary"><ArrowLeft /> Back to Subscriptions</Button></Link>} /><SubscriptionForm instances={instances} plans={plans} action="/subscriptions" method="post" submitLabel="Create record" /></AppLayout>; }
