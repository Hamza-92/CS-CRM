import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { SupportTicketForm } from '@/components/support-tickets/support-ticket-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { UserRef } from '@/types';
type Ref = { id: number; name: string; business?: string | null; email?: string | null };
export default function TicketCreate({ customers, instances, assignees }: { customers: Ref[]; instances: Ref[]; assignees: UserRef[] }) { return <AppLayout><Head title="New support ticket" /><PageHeader title="New support ticket" actions={<Link href="/support-tickets"><Button variant="secondary"><ArrowLeft /> Back to Tickets</Button></Link>} /><SupportTicketForm customers={customers} instances={instances} assignees={assignees} action="/support-tickets" method="post" submitLabel="Create ticket" /></AppLayout>; }
