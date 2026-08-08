import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PaymentForm } from '@/components/payments/payment-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Subscription } from '@/types';
type Option = Pick<Subscription, 'id' | 'status' | 'kind'> & { application_instance?: { name: string; customer?: { name: string; business?: string | null } | null } | null; plan?: { name: string; code: string; currency?: string } | null };
export default function PaymentCreate({ subscriptions, currencies, defaultCurrency }: { subscriptions: Option[]; currencies: string[]; defaultCurrency: string }) { return <AppLayout><Head title="New payment" /><PageHeader title="New payment" actions={<Link href="/payments"><Button variant="secondary"><ArrowLeft /> Back to Payments</Button></Link>} /><PaymentForm subscriptions={subscriptions} currencies={currencies} defaultCurrency={defaultCurrency} action="/payments" method="post" submitLabel="Create payment" /></AppLayout>; }
