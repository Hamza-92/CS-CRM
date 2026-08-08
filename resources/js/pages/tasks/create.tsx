import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { TaskForm } from '@/components/tasks/task-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { SupportTicket, UserRef } from '@/types';
type Ref = { id: number; name: string; business?: string | null; email?: string | null };
export default function TaskCreate({ customers, instances, tickets, assignees }: { customers: Ref[]; instances: Ref[]; tickets: Pick<SupportTicket, 'id' | 'ticket_number' | 'subject'>[]; assignees: UserRef[] }) { return <AppLayout><Head title="New task" /><PageHeader title="New task" actions={<Link href="/tasks"><Button variant="secondary"><ArrowLeft /> Back to Tasks</Button></Link>} /><TaskForm customers={customers} instances={instances} tickets={tickets} assignees={assignees} action="/tasks" method="post" submitLabel="Create task" /></AppLayout>; }
