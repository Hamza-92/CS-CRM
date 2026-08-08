import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { SubscriptionForm } from '@/components/subscriptions/subscription-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Plan, Subscription } from '@/types';

type InstanceOption = { id: number; name: string; customer?: { name: string; business?: string | null } | null; product?: { name: string; code: string } | null; environment?: string; status?: string };
export default function SubscriptionEdit({ subscription, instances, plans }: { subscription: Subscription; instances: InstanceOption[]; plans: Plan[] }) { return <AppLayout><Head title="Edit subscription" /><PageHeader title="Edit subscription" actions={<Link href={`/subscriptions/${subscription.id}`}><Button variant="secondary"><ArrowLeft /> Back to subscription</Button></Link>} /><SubscriptionForm subscription={subscription} instances={instances} plans={plans} action={`/subscriptions/${subscription.id}`} method="put" submitLabel="Save changes" /></AppLayout>; }
