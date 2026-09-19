import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    BriefcaseBusiness,
    Building2,
    CalendarClock,
    ChevronDown,
    CircleDollarSign,
    Edit3,
    ExternalLink,
    Globe2,
    Mail,
    MapPin,
    MessageCircle,
    Pencil,
    Phone,
    Plus,
    Server,
    Tag,
    TicketCheck,
    Trash2,
    UserRound,
    UsersRound,
    Wrench,
    type LucideIcon,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Field, Input, Textarea } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dateTime, relativeTime, shortDate, toneForEvent } from '@/lib/format';
import type { Activity as ActivityItem, Customer } from '@/types';
import type { FollowUpSummaryItem } from '@/components/follow-ups/follow-up-summary';

const titleCase = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (amount: string | number, currency: string) => `${currency} ${Number(amount || 0).toLocaleString()}`;

type Contact = NonNullable<Customer['contacts']>[number];
type ContactDraft = {
    name: string;
    job_title: string;
    email: string;
    phone: string;
    whatsapp: string;
    is_primary: boolean;
    notes: string;
};

type CustomerPermissions = {
    update: boolean;
    create_follow_up: boolean;
    create_deal: boolean;
    archive: boolean;
    manage_contacts: boolean;
    create_instance: boolean;
    create_subscription: boolean;
    create_payment: boolean;
    create_ticket: boolean;
    create_task: boolean;
};

const emptyContact: ContactDraft = {
    name: '',
    job_title: '',
    email: '',
    phone: '',
    whatsapp: '',
    is_primary: false,
    notes: '',
};

function CollapsibleSection({
    title,
    description,
    icon: Icon,
    count,
    defaultOpen = false,
    action,
    children,
}: {
    title: string;
    description?: string;
    icon: LucideIcon;
    count?: number;
    defaultOpen?: boolean;
    action?: ReactNode;
    children: ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <Card>
            <div className={cn('flex items-center gap-2 px-3.5', open && 'border-b border-line')}>
                <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 py-3 text-left"
                    onClick={() => setOpen((value) => !value)}
                    aria-expanded={open}
                >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-wash text-brand">
                        <Icon className="size-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                            <span className="truncate text-xs font-semibold text-ink">{title}</span>
                            {typeof count === 'number' && <Badge tone="neutral" size="sm">{count}</Badge>}
                        </span>
                        {description && <span className="mt-0.5 hidden truncate text-2xs text-ink-3 sm:block">{description}</span>}
                    </span>
                </button>
                {action && <div className="shrink-0">{action}</div>}
                <button
                    type="button"
                    className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink"
                    onClick={() => setOpen((value) => !value)}
                    aria-label={`${open ? 'Collapse' : 'Expand'} ${title}`}
                    aria-expanded={open}
                >
                    <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
                </button>
            </div>
            {open && <div className="p-3.5">{children}</div>}
        </Card>
    );
}

function WorkspaceStat({ icon: Icon, label, value, hint, tone = 'brand' }: { icon: LucideIcon; label: string; value: ReactNode; hint: string; tone?: 'brand' | 'ok' | 'warn' | 'info' }) {
    const colors = {
        brand: 'bg-brand-wash text-brand',
        ok: 'bg-ok-wash text-ok',
        warn: 'bg-warn-wash text-warn',
        info: 'bg-info-wash text-info',
    };

    return (
        <Card className="p-3 sm:p-3.5">
            <div className="flex items-start gap-3">
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', colors[tone])}><Icon className="size-4" /></span>
                <div className="min-w-0">
                    <p className="text-2xs uppercase tracking-wider text-ink-3">{label}</p>
                    <p className="num mt-0.5 truncate text-lg font-semibold text-ink">{value}</p>
                    <p className="mt-0.5 truncate text-2xs text-ink-3">{hint}</p>
                </div>
            </div>
        </Card>
    );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="grid gap-1 border-b border-line/70 py-2.5 last:border-b-0 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center">
            <dt className="text-2xs font-medium uppercase tracking-wide text-ink-3">{label}</dt>
            <dd className="min-w-0 text-xs font-medium text-ink sm:text-right">{children}</dd>
        </div>
    );
}

function EmptyCopy({ children }: { children: ReactNode }) {
    return <p className="rounded-lg border border-dashed border-line-2 bg-surface-2/50 px-3 py-5 text-center text-xs text-ink-3">{children}</p>;
}

function ContactModal({ customerId, contact, open, onClose }: { customerId: number; contact: Contact | null; open: boolean; onClose: () => void }) {
    const form = useForm<ContactDraft>(contact ? {
        name: contact.name,
        job_title: contact.job_title ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        whatsapp: contact.whatsapp ?? '',
        is_primary: contact.is_primary,
        notes: contact.notes ?? '',
    } : emptyContact);
    const editing = contact !== null;

    function close() {
        form.reset();
        form.clearErrors();
        onClose();
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: close };
        if (contact) {
            form.put(`/customers/${customerId}/contacts/${contact.id}`, options);
        } else {
            form.post(`/customers/${customerId}/contacts`, options);
        }
    }

    return (
        <Modal
            open={open}
            onClose={close}
            title={editing ? 'Edit contact' : 'Add contact'}
            width="lg"
            footer={<><Button variant="secondary" onClick={close}>Cancel</Button><Button type="submit" form="customer-contact-form" disabled={form.processing}>{editing ? 'Save contact' : 'Add contact'}</Button></>}
        >
            <form id="customer-contact-form" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" error={form.errors.name} required>{(props) => <Input {...props} value={form.data.name} onChange={(event) => form.setData('name', event.target.value)} placeholder="Contact name" />}</Field>
                <Field label="Job title" error={form.errors.job_title}>{(props) => <Input {...props} value={form.data.job_title} onChange={(event) => form.setData('job_title', event.target.value)} placeholder="Owner, manager..." />}</Field>
                <Field label="Email" error={form.errors.email}>{(props) => <Input {...props} type="email" value={form.data.email} onChange={(event) => form.setData('email', event.target.value)} placeholder="name@example.com" />}</Field>
                <Field label="Phone" error={form.errors.phone}>{(props) => <Input {...props} value={form.data.phone} onChange={(event) => form.setData('phone', event.target.value)} placeholder="Phone number" />}</Field>
                <Field label="WhatsApp" error={form.errors.whatsapp}>{(props) => <Input {...props} value={form.data.whatsapp} onChange={(event) => form.setData('whatsapp', event.target.value)} placeholder="WhatsApp number" />}</Field>
                <label className="flex items-center gap-2 self-end pb-2 text-xs text-ink-2"><input type="checkbox" className="size-4 rounded border-line accent-brand" checked={form.data.is_primary} onChange={(event) => form.setData('is_primary', event.target.checked)} />Primary contact</label>
                <Field label="Notes" error={form.errors.notes} className="sm:col-span-2">{(props) => <Textarea {...props} rows={3} value={form.data.notes} onChange={(event) => form.setData('notes', event.target.value)} placeholder="Role, availability, or communication preferences" />}</Field>
            </form>
        </Modal>
    );
}

export default function CustomerShow({ customer, sourceLead, activities, followUps, can }: { customer: Customer; sourceLead: { id: number; name: string; status: string; converted_at: string | null } | null; activities: ActivityItem[]; followUps: FollowUpSummaryItem[]; can: CustomerPermissions }) {
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<Contact | null>(null);
    const contacts = customer.contacts ?? [];
    const instances = customer.instances ?? [];
    const subscriptions = instances.flatMap((instance) => instance.subscriptions ?? []);
    const payments = subscriptions.flatMap((subscription) => subscription.payments ?? []);
    const duePayments = payments.filter((payment) => ['pending', 'partially_paid'].includes(payment.status));
    const activeSubscriptions = subscriptions.filter((subscription) => ['active', 'trialing'].includes(subscription.status));
    const openTickets = (customer.support_tickets ?? []).filter((ticket) => !['closed', 'resolved'].includes(ticket.status));
    const openTasks = (customer.tasks ?? []).filter((task) => !['completed', 'cancelled'].includes(task.status));
    const pendingFollowUps = followUps.filter((followUp) => ['pending', 'rescheduled'].includes(followUp.status));
    const nextFollowUp = [...pendingFollowUps].sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
    const whatsappNumber = customer.whatsapp || customer.phone;

    function newContact() {
        setEditingContact(null);
        setContactModalOpen(true);
    }

    function editContact(contact: Contact) {
        setEditingContact(contact);
        setContactModalOpen(true);
    }

    return (
        <AppLayout>
            <Head title={customer.name} />
            <PageHeader
                title={customer.name}
                description={customer.business || 'Customer account workspace'}
                breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: customer.name }]}
                badge={<Badge tone={customer.status === 'active' ? 'ok' : 'neutral'} size="sm" dot>{titleCase(customer.status)}</Badge>}
                actions={<>
                    <Link href="/customers"><Button variant="secondary"><ArrowLeft /> <span className="hidden sm:inline">Customers</span></Button></Link>
                    {can.update && <Link href={`/customers/${customer.id}/edit`}><Button variant="secondary"><Edit3 /> Edit</Button></Link>}
                    {can.archive && <Tooltip label="Archive customer"><button type="button" onClick={() => router.delete(`/customers/${customer.id}`)} className="flex size-9 items-center justify-center rounded-md border border-line-2 text-bad shadow-card transition-colors hover:bg-bad-wash"><Trash2 className="size-4" /></button></Tooltip>}
                </>}
            />

            <Card className="mb-4 overflow-hidden bg-gradient-to-br from-brand-wash/80 via-surface to-info-wash/50">
                <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={customer.name} size="lg" />
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-base font-semibold text-ink">{customer.business || customer.name}</h2>
                                {customer.source_label && <Badge tone="brand" size="sm">{customer.source_label}</Badge>}
                            </div>
                            <p className="mt-1 text-xs text-ink-2">Managed by {customer.owner?.name || 'an unassigned owner'} · Customer since {shortDate(customer.created_at)}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {customer.phone && <a href={`tel:${customer.phone}`}><Button variant="secondary" size="sm"><Phone /> Call</Button></a>}
                        {customer.email && <a href={`mailto:${customer.email}`}><Button variant="secondary" size="sm"><Mail /> Email</Button></a>}
                        {whatsappNumber && <a href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"><Button variant="secondary" size="sm"><MessageCircle /> WhatsApp message</Button></a>}
                    </div>
                </CardBody>
            </Card>

            <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
                <WorkspaceStat icon={Server} label="Applications" value={instances.length} hint={`${instances.filter((instance) => instance.status === 'active').length} active`} tone="brand" />
                <WorkspaceStat icon={CircleDollarSign} label="Subscriptions" value={activeSubscriptions.length} hint={`${duePayments.length} payments due`} tone={duePayments.length ? 'warn' : 'ok'} />
                <WorkspaceStat icon={TicketCheck} label="Open work" value={openTickets.length + openTasks.length} hint={`${openTickets.length} tickets · ${openTasks.length} tasks`} tone={openTickets.length + openTasks.length ? 'info' : 'ok'} />
                <WorkspaceStat icon={CalendarClock} label="Next follow-up" value={nextFollowUp ? shortDate(nextFollowUp.scheduled_at) : 'None'} hint={`${pendingFollowUps.length} pending`} tone={nextFollowUp?.is_overdue ? 'warn' : 'info'} />
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.75fr)]">
                <div className="space-y-4">
                    <CollapsibleSection
                        title="Applications & subscriptions"
                        description="Tenant status, deployments, plans, renewals, and payments"
                        icon={Server}
                        count={instances.length}
                        defaultOpen
                        action={can.create_instance ? <Link href={`/instances/create?customer_id=${customer.id}`}><Button size="sm"><Plus /> <span className="hidden sm:inline">Application</span></Button></Link> : undefined}
                    >
                        {instances.length === 0 ? <EmptyCopy>No application has been created for this customer.</EmptyCopy> : <div className="space-y-3">{instances.map((instance) => {
                            const instanceDuePayments = instance.subscriptions.flatMap((subscription) => subscription.payments).filter((payment) => ['pending', 'partially_paid'].includes(payment.status));
                            return <div key={instance.id} className="rounded-lg border border-line bg-surface-2/55 p-3 sm:p-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Link href={`/instances/${instance.id}`} className="truncate text-sm font-semibold text-ink hover:text-brand">{instance.name}</Link>
                                            <Badge tone={instance.status === 'active' ? 'ok' : instance.status === 'paused' ? 'warn' : 'neutral'} size="sm">{titleCase(instance.status)}</Badge>
                                            {instance.counterpos_status && <Badge tone={instance.counterpos_status === 'active' ? 'ok' : 'info'} size="sm">CounterPOS {titleCase(instance.counterpos_status)}</Badge>}
                                        </div>
                                        <p className="mt-1 text-xs text-ink-3">{instance.product?.name || 'Product not selected'} · {titleCase(instance.environment)}{instance.version ? ` · v${instance.version}` : ''}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {instance.deployment_url && <a href={instance.deployment_url} target="_blank" rel="noreferrer"><Button variant="secondary" size="xs"><Globe2 /> Open</Button></a>}
                                        <Link href={`/instances/${instance.id}`}><Button variant="secondary" size="xs">Manage <ExternalLink /></Button></Link>
                                    </div>
                                </div>
                                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    <div className="rounded-md bg-surface px-3 py-2"><div className="text-2xs uppercase tracking-wide text-ink-3">Tenant</div><div className="mt-0.5 truncate text-xs font-medium text-ink">{instance.counterpos_tenant_id ? 'Linked' : 'Not linked'}</div></div>
                                    <div className="rounded-md bg-surface px-3 py-2"><div className="text-2xs uppercase tracking-wide text-ink-3">Schema</div><div className="num mt-0.5 text-xs font-medium text-ink">{instance.counterpos_schema_version ?? 'Not reported'}</div></div>
                                    <div className="rounded-md bg-surface px-3 py-2"><div className="text-2xs uppercase tracking-wide text-ink-3">Template</div><div className="mt-0.5 truncate text-xs font-medium text-ink">{instance.provisioning_template_code ? titleCase(instance.provisioning_template_code) : 'Not selected'}</div></div>
                                </div>
                                <div className="mt-3 border-t border-line pt-3">
                                    <div className="mb-2 flex items-center justify-between"><span className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Subscriptions</span>{instanceDuePayments.length > 0 && <Badge tone="warn" size="sm">{instanceDuePayments.length} due</Badge>}</div>
                                    {instance.subscriptions.length === 0 ? <p className="text-xs text-ink-3">No subscription attached.</p> : <div className="grid gap-2 sm:grid-cols-2">{instance.subscriptions.map((subscription) => <Link key={subscription.id} href={`/subscriptions/${subscription.id}`} className="rounded-md border border-line bg-surface px-3 py-2.5 transition-colors hover:border-brand-line hover:bg-brand-wash/40"><div className="flex items-center justify-between gap-2"><span className="truncate text-xs font-medium text-ink">{subscription.plan?.name || titleCase(subscription.kind)}</span><Badge tone={subscription.status === 'active' ? 'ok' : subscription.status === 'past_due' ? 'bad' : 'neutral'} size="sm">{titleCase(subscription.status)}</Badge></div><p className="mt-1 text-2xs text-ink-3">Renews {shortDate(subscription.renewal_at || subscription.ends_at)} · {subscription.payments.length} payments</p></Link>)}</div>}
                                </div>
                            </div>;
                        })}</div>}
                    </CollapsibleSection>

                    <CollapsibleSection title="Service & delivery" description="Support requests and internal work assigned to this customer" icon={Wrench} count={(customer.support_tickets?.length ?? 0) + (customer.tasks?.length ?? 0)} defaultOpen={openTickets.length + openTasks.length > 0}>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div><div className="mb-2 flex items-center justify-between"><h3 className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Support tickets</h3>{can.create_ticket && <Link href={`/support-tickets/create?customer_id=${customer.id}`} className="text-2xs font-medium text-brand hover:underline">New ticket</Link>}</div>{customer.support_tickets?.length ? <div className="space-y-2">{customer.support_tickets.map((ticket) => <Link key={ticket.id} href={`/support-tickets/${ticket.id}`} className="block rounded-md border border-line bg-surface-2 px-3 py-2.5 hover:bg-surface-3"><div className="flex items-center justify-between gap-2"><span className="num text-2xs font-semibold text-ink-3">{ticket.ticket_number}</span><Badge tone={['closed', 'resolved'].includes(ticket.status) ? 'neutral' : 'warn'} size="sm">{titleCase(ticket.status)}</Badge></div><p className="mt-1 truncate text-xs font-medium text-ink">{ticket.subject}</p></Link>)}</div> : <EmptyCopy>No support tickets.</EmptyCopy>}</div>
                            <div><div className="mb-2 flex items-center justify-between"><h3 className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Tasks</h3>{can.create_task && <Link href={`/tasks/create?customer_id=${customer.id}`} className="text-2xs font-medium text-brand hover:underline">New task</Link>}</div>{customer.tasks?.length ? <div className="space-y-2">{customer.tasks.map((task) => <Link key={task.id} href={`/tasks/${task.id}`} className="block rounded-md border border-line bg-surface-2 px-3 py-2.5 hover:bg-surface-3"><div className="flex items-center justify-between gap-2"><span className="num text-2xs font-semibold text-ink-3">{task.task_number}</span><Badge tone={task.status === 'completed' ? 'ok' : task.priority === 'urgent' ? 'bad' : 'info'} size="sm">{titleCase(task.status)}</Badge></div><p className="mt-1 truncate text-xs font-medium text-ink">{task.title}</p><p className="mt-1 text-2xs text-ink-3">Due {shortDate(task.due_at)}</p></Link>)}</div> : <EmptyCopy>No tasks.</EmptyCopy>}</div>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection title="Commercial history" description="Deals and lead records kept for context" icon={BriefcaseBusiness} count={(customer.deals?.length ?? 0) + (customer.leads?.length ?? 0)}>
                        <div className="grid gap-4 lg:grid-cols-2">
                            <div><div className="mb-2 flex items-center justify-between"><h3 className="text-2xs font-semibold uppercase tracking-wide text-ink-3">Deals</h3>{can.create_deal && <Link href={`/deals/create?customer_id=${customer.id}`} className="text-2xs font-medium text-brand hover:underline">New deal</Link>}</div>{customer.deals?.length ? <div className="space-y-2">{customer.deals.map((deal) => <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5 hover:bg-surface-3"><span className="min-w-0"><span className="block truncate text-xs font-medium text-ink">{deal.title}</span><span className="num text-2xs text-ink-3">{money(deal.amount || 0, deal.currency)}</span></span><Badge tone="info" size="sm">{deal.stage?.name || 'Open'}</Badge></Link>)}</div> : <EmptyCopy>No deals.</EmptyCopy>}</div>
                            <div><h3 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-3">Lead history</h3>{customer.leads?.length ? <div className="space-y-2">{customer.leads.map((lead) => <Link key={lead.id} href={`/leads/${lead.id}`} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5 hover:bg-surface-3"><span className="min-w-0"><span className="block truncate text-xs font-medium text-ink">{lead.name}</span><span className="block truncate text-2xs text-ink-3">{lead.business || lead.email || 'Lead record'}</span></span><Badge tone="neutral" size="sm">{titleCase(lead.status)}</Badge></Link>)}</div> : <EmptyCopy>No lead history.</EmptyCopy>}</div>
                        </div>
                    </CollapsibleSection>
                </div>

                <div className="space-y-4">
                    <CollapsibleSection title="Follow-ups" description="Upcoming customer contact and overdue actions" icon={CalendarClock} count={followUps.length} defaultOpen action={can.create_follow_up ? <Link href={`/follow-ups/create?customer_id=${customer.id}`}><Button variant="secondary" size="sm"><Plus /> <span className="hidden sm:inline">Add</span></Button></Link> : undefined}>
                        {followUps.length === 0 ? <EmptyCopy>No follow-ups scheduled.</EmptyCopy> : <div className="space-y-2">{followUps.slice(0, 6).map((followUp) => <div key={followUp.id} className="flex items-center gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5"><CalendarClock className={cn('size-4 shrink-0', followUp.is_overdue ? 'text-bad' : 'text-ink-3')} /><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-ink">{followUp.reason}</p><p className={cn('num mt-0.5 text-2xs', followUp.is_overdue ? 'font-semibold text-bad' : 'text-ink-3')}>{dateTime(followUp.scheduled_at)}</p></div><Badge tone={followUp.is_overdue ? 'bad' : followUp.status === 'completed' ? 'ok' : 'info'} size="sm">{followUp.is_overdue ? 'Overdue' : followUp.status_label}</Badge></div>)}</div>}
                    </CollapsibleSection>

                    <CollapsibleSection title="Customer details" description="Contact, ownership, source, and account metadata" icon={Building2} defaultOpen>
                        <dl>
                            <Detail label="Business">{customer.business || 'Not specified'}</Detail>
                            <Detail label="Email">{customer.email ? <a className="text-brand hover:underline" href={`mailto:${customer.email}`}>{customer.email}</a> : 'Not specified'}</Detail>
                            <Detail label="Phone">{customer.phone ? <a className="num text-brand hover:underline" href={`tel:${customer.phone}`}>{customer.phone}</a> : 'Not specified'}</Detail>
                            <Detail label="WhatsApp">{customer.whatsapp || 'Not specified'}</Detail>
                            <Detail label="Location">{customer.city ? <span className="inline-flex items-center gap-1"><MapPin className="size-3.5 text-ink-3" />{customer.city}</span> : 'Not specified'}</Detail>
                            <Detail label="Owner">{customer.owner ? <span className="inline-flex items-center gap-1.5"><Avatar name={customer.owner.name} src={customer.owner.avatar_url} size="xs" />{customer.owner.name}</span> : 'Unassigned'}</Detail>
                            <Detail label="Source">{customer.source_label || 'Not specified'}</Detail>
                            <Detail label="Last contact">{shortDate(customer.last_contacted_at)}</Detail>
                        </dl>
                    </CollapsibleSection>

                    <CollapsibleSection title="Contacts" description="People associated with this customer account" icon={UsersRound} count={contacts.length} defaultOpen action={can.manage_contacts ? <Button variant="secondary" size="sm" onClick={newContact}><Plus /> <span className="hidden sm:inline">Add</span></Button> : undefined}>
                        {contacts.length === 0 ? <EmptyCopy>No additional contacts yet.</EmptyCopy> : <div className="space-y-2">{contacts.map((contact) => <div key={contact.id} className="flex items-start gap-3 rounded-lg border border-line bg-surface-2 p-3"><Avatar name={contact.name} size="sm" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-ink">{contact.name}</span>{contact.is_primary && <Badge tone="brand" size="sm">Primary</Badge>}</div><p className="mt-0.5 truncate text-2xs text-ink-3">{contact.job_title || 'Contact'}</p><div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-ink-2">{contact.email && <a href={`mailto:${contact.email}`} className="hover:text-brand">{contact.email}</a>}{contact.phone && <a href={`tel:${contact.phone}`} className="num hover:text-brand">{contact.phone}</a>}</div></div>{can.manage_contacts && <div className="flex shrink-0 gap-1"><button type="button" onClick={() => editContact(contact)} className="rounded p-1.5 text-ink-3 hover:bg-surface-3 hover:text-ink" aria-label={`Edit ${contact.name}`}><Pencil className="size-3.5" /></button><button type="button" onClick={() => router.delete(`/customers/${customer.id}/contacts/${contact.id}`, { preserveScroll: true })} className="rounded p-1.5 text-ink-3 hover:bg-bad-wash hover:text-bad" aria-label={`Delete ${contact.name}`}><Trash2 className="size-3.5" /></button></div>}</div>)}</div>}
                    </CollapsibleSection>

                    <CollapsibleSection title="Notes & tags" description="Internal context that is useful occasionally" icon={Tag} count={customer.tags.length}>
                        {customer.tags.length > 0 && <div className="mb-3 flex flex-wrap gap-2">{customer.tags.map((tag) => <Badge key={tag} tone="brand" size="md">{tag}</Badge>)}</div>}
                        {customer.notes ? <p className="whitespace-pre-line text-xs leading-relaxed text-ink-2">{customer.notes}</p> : <EmptyCopy>No notes have been added.</EmptyCopy>}
                    </CollapsibleSection>

                    <CollapsibleSection title="Activity" description="Recent changes made by the CRM team" icon={Activity} count={activities.length}>
                        {activities.length === 0 ? <EmptyCopy>No activity recorded.</EmptyCopy> : <ul className="divide-y divide-line/70">{activities.map((item) => <li key={item.id} className="flex items-center gap-2.5 py-2.5"><Avatar name={item.user?.name ?? 'System'} src={item.user?.avatar_url} size="sm" /><div className="min-w-0 flex-1"><p className="truncate text-xs text-ink">{item.description ?? item.event}</p><p className="truncate text-2xs text-ink-3">{item.user?.name ?? 'System'} · {dateTime(item.created_at)}</p></div><Badge tone={toneForEvent(item.event)} size="sm">{item.event.split('.').pop()}</Badge><time suppressHydrationWarning className="num shrink-0 text-2xs text-ink-3">{relativeTime(item.created_at)}</time></li>)}</ul>}
                    </CollapsibleSection>

                    {sourceLead && <CollapsibleSection title="Conversion history" description="Original lead record and conversion source" icon={UserRound} count={1}><Link href={`/leads/${sourceLead.id}`} className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-3 py-2.5 hover:bg-surface-3"><span className="flex min-w-0 items-center gap-2"><UserRound className="size-4 shrink-0 text-brand" /><span className="truncate text-xs font-medium text-ink">Converted from {sourceLead.name}</span></span><Badge tone="neutral" size="sm">{titleCase(sourceLead.status)}</Badge></Link></CollapsibleSection>}
                </div>
            </div>

            <ContactModal
                key={editingContact?.id ?? 'new'}
                customerId={customer.id}
                contact={editingContact}
                open={contactModalOpen}
                onClose={() => setContactModalOpen(false)}
            />
        </AppLayout>
    );
}
