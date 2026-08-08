import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { DealForm } from '@/components/deals/deal-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { DealStage, UserRef } from '@/types';

interface Contact { id: number; name: string; business: string | null; email: string | null }
interface Product { id: number; name: string; code: string; brand_color: string | null; plans: { id: number; name: string; code: string; price: string; currency: string }[] }

export default function DealCreate(props: { defaults: { lead_id: number | null; customer_id: number | null; stage_id: number | null; currency: string }; leads: Contact[]; customers: Contact[]; products: Product[]; stages: DealStage[]; owners: UserRef[]; currencies: { value: string; label: string }[] }) {
    return <AppLayout><Head title="New deal" /><PageHeader title="New deal" actions={<Link href="/deals"><Button variant="secondary"><ArrowLeft /> Back to Deals</Button></Link>} /><DealForm {...props} action="/deals" method="post" submitLabel="Create deal" /></AppLayout>;
}
