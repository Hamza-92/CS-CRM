import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { TaskForm } from '@/components/tasks/task-form';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { SupportTicket, UserRef, WorkTask } from '@/types';
type Ref = { id: number; name: string; business?: string | null; email?: string | null };
export default function TaskEdit({ task, customers, instances, tickets, assignees }: { task: WorkTask; customers: Ref[]; instances: Ref[]; tickets: Pick<SupportTicket, 'id' | 'ticket_number' | 'subject'>[]; assignees: UserRef[] }) { return <AppLayout><Head title={`Edit ${task.task_number}`} /><PageHeader title="Edit task" actions={<Link href={`/tasks/${task.id}`}><Button variant="secondary"><ArrowLeft /> Back to task</Button></Link>} /><TaskForm task={task} customers={customers} instances={instances} tickets={tickets} assignees={assignees} action={`/tasks/${task.id}`} method="put" submitLabel="Save changes" /></AppLayout>; }
