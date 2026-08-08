import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PaymentForm } from '@/components/payments/payment-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Payment, Subscription } from '@/types';
type Option = Pick<Subscription, 'id' | 'status' | 'kind'> & { application_instance?: { name: string; customer?: { name: string; business?: string | null } | null } | null; plan?: { name: string; code: string; currency?: string } | null };
export default function PaymentEdit({ payment, subscriptions, currencies }: { payment: Payment; subscriptions: Option[]; currencies: string[] }) { return <AppLayout><Head title="Edit payment" /><PageHeader title="Edit payment" actions={<Link href={`/payments/${payment.id}`}><Button variant="secondary"><ArrowLeft /> Back to payment</Button></Link>} /><PaymentForm payment={payment} subscriptions={subscriptions} currencies={currencies} action={`/payments/${payment.id}`} method="put" submitLabel="Save changes" /></AppLayout>; }
