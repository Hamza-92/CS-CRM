import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { DealForm } from '@/components/deals/deal-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { Deal, DealStage, UserRef } from '@/types';

interface Contact { id: number; name: string; business: string | null; email: string | null }
interface Product { id: number; name: string; code: string; brand_color: string | null; plans: { id: number; name: string; code: string; price: string; currency: string }[] }

export default function DealEdit(props: { deal: Deal; leads: Contact[]; customers: Contact[]; products: Product[]; stages: DealStage[]; owners: UserRef[]; currencies: { value: string; label: string }[] }) {
    return <AppLayout><Head title={`Edit ${props.deal.title}`} /><PageHeader title="Edit deal" actions={<Link href={`/deals/${props.deal.id}`}><Button variant="secondary"><ArrowLeft /> Back to Deal</Button></Link>} /><DealForm {...props} action={`/deals/${props.deal.id}`} method="put" submitLabel="Save changes" /></AppLayout>;
}
