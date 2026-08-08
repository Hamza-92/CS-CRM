import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { SupportTicketForm } from '@/components/support-tickets/support-ticket-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { SupportTicket, UserRef } from '@/types';
type Ref = { id: number; name: string; business?: string | null; email?: string | null };
export default function TicketEdit({ ticket, customers, instances, assignees }: { ticket: SupportTicket; customers: Ref[]; instances: Ref[]; assignees: UserRef[] }) { return <AppLayout><Head title={`Edit ${ticket.ticket_number}`} /><PageHeader title="Edit support ticket" actions={<Link href={`/support-tickets/${ticket.id}`}><Button variant="secondary"><ArrowLeft /> Back to ticket</Button></Link>} /><SupportTicketForm ticket={ticket} customers={customers} instances={instances} assignees={assignees} action={`/support-tickets/${ticket.id}`} method="put" submitLabel="Save changes" /></AppLayout>; }
