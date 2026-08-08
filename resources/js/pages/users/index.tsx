import { Head, router } from '@inertiajs/react';
import {
    CalendarDays,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    History,
    Eye,
    KeyRound,
    Lock,
    LockOpen,
    List,
    LayoutGrid,
    Pencil,
    Plus,
    Search,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { ResetPasswordModal } from '@/components/users/reset-password-modal';
import { UserModal } from '@/components/users/user-modal';
import { ViewUserModal } from '@/components/users/view-user-modal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useFilters } from '@/hooks/use-filters';
import { useAuth } from '@/hooks/use-auth';
import { usePersistedState } from '@/hooks/use-persisted-state';
import AppLayout from '@/layouts/app-layout';
import type { ManagedUser, Paginated, RoleOption } from '@/types';
import { shortDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
    users: Paginated<ManagedUser>;
    roles: RoleOption[];
    filters: { search: string; status: string; role: string; sort: string; direction: 'asc' | 'desc'; per_page: number };
    can: { create: boolean; manage: boolean; login_history: boolean };
}

const actionButton =
    'flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-4';

export default function UsersIndex({ users, roles, filters, can }: Props) {
    const { user: currentUser, hasRole } = useAuth();
    const { values, set, setMany } = useFilters('/users', {
        search: filters.search,
        status: filters.status,
        role: filters.role,
        sort: filters.sort,
        direction: filters.direction,
        per_page: filters.per_page,
    });

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ManagedUser | null>(null);
    const [viewing, setViewing] = useState<ManagedUser | null>(null);
    const [resetting, setResetting] = useState<ManagedUser | null>(null);
    const [confirmation, setConfirmation] = useState<{ user: ManagedUser; action: 'status' | 'delete' } | null>(null);
    const [activeView, setActiveView] = usePersistedState<'list' | 'grid'>('crm.users.view', 'list');
    const hasFilters = Boolean(values.search || values.status || values.role);

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(user: ManagedUser) {
        if (isProtectedTarget(user)) return;

        setEditing(user);
        setFormOpen(true);
    }

    function toggleStatus(user: ManagedUser) {
        if (isSelf(user) || isProtectedTarget(user)) return;

        setConfirmation({ user, action: 'status' });
    }

    function remove(user: ManagedUser) {
        if (isSelf(user) || isProtectedTarget(user)) return;

        setConfirmation({ user, action: 'delete' });
    }

    function isSelf(user: ManagedUser) {
        return currentUser?.id === user.id;
    }

    function isProtectedTarget(user: ManagedUser) {
        return user.roles?.some((role) => role.name === 'super_admin') === true && !hasRole('super_admin');
    }

    function actionTooltip(user: ManagedUser, action: 'edit' | 'reset' | 'status' | 'delete') {
        if (isSelf(user)) {
            return action === 'delete'
                ? 'You cannot delete your own account'
                : action === 'status'
                  ? 'You cannot change your own status'
                  : action === 'reset'
                    ? 'You cannot reset your own password here'
                    : 'You can edit your own profile';
        }

        if (isProtectedTarget(user)) return 'Super Admin is protected';

        return action === 'edit' ? 'Edit' : action === 'reset' ? 'Reset password' : action === 'status' ? (user.is_active ? 'Deactivate' : 'Activate') : 'Delete';
    }

    function confirmAction() {
        if (!confirmation) return;

        const { user, action } = confirmation;
        const options = { preserveScroll: true, onFinish: () => setConfirmation(null) };

        if (action === 'delete') {
            router.delete(`/users/${user.id}`, options);
        } else {
            router.patch(`/users/${user.id}/status`, {}, options);
        }
    }

    function sortable(column: string, label: string) {
        const isSorted = filters.sort === column;

        return (
            <button
                type="button"
                onClick={() =>
                    setMany({ sort: column, direction: isSorted && filters.direction === 'asc' ? 'desc' : 'asc' })
                }
                className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold',
                    isSorted ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
            >
                {label}
                {isSorted ? (
                    filters.direction === 'asc' ? <ChevronUp aria-hidden="true" className="size-4" /> : <ChevronDown aria-hidden="true" className="size-4" />
                ) : <ChevronsUpDown aria-hidden="true" className="size-4 opacity-50" />}
            </button>
        );
    }

    return (
        <AppLayout>
            <Head title="Users" />

            <PageHeader
                title="Users"
    actions={
                    <div className="flex items-center gap-2">
                        {can.login_history && <Tooltip label="Login History">
                            <Button variant="secondary" size="icon" aria-label="Login History" onClick={() => router.visit('/login-history')}>
                                <History />
                            </Button>
                        </Tooltip>}
                        {can.create && (
                            <Button onClick={openCreate}>
                                <Plus />
                                Add User
                            </Button>
                        )}
                    </div>
                }
            />

            <Card className="mb-4 p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                        <Input
                            type="search"
                            placeholder="Search users"
                            aria-label="Search users"
                            className="pl-8"
                            value={values.search ?? ''}
                            onChange={(event) => set('search', event.target.value, 300)}
                        />
                    </div>

                    <div className="w-44">
                        <SearchableSelect
                            options={[{ value: '', label: 'All roles' }, ...roles.map((role) => ({ value: role.value, label: role.label }))]}
                            value={values.role ?? ''}
                            onChange={(value) => set('role', value)}
                            placeholder="All roles"
                            searchPlaceholder="Search roles..."
                        />
                    </div>

                    <div className="w-36">
                        <SearchableSelect
                            options={[{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]}
                            value={values.status ?? ''}
                            onChange={(value) => set('status', value)}
                            placeholder="All statuses"
                            searchPlaceholder="Search..."
                        />
                    </div>

                    {hasFilters && (
                        <button type="button" onClick={() => setMany({ search: '', role: '', status: '' })} className="text-xs font-medium text-brand hover:underline">
                            Clear filters
                        </button>
                    )}

                    <div className="ml-auto flex items-center gap-2">
                        <div className="mr-2 flex rounded-md border border-line bg-surface p-0.5">
                            <button type="button" aria-label="List view" onClick={() => setActiveView('list')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', activeView === 'list' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><List className="size-4" /></button>
                            <button type="button" aria-label="Grid view" onClick={() => setActiveView('grid')} className={cn('flex h-7 items-center justify-center rounded px-2 transition-colors', activeView === 'grid' ? 'bg-brand text-brand-ink' : 'text-ink-3 hover:bg-surface-3')}><LayoutGrid className="size-4" /></button>
                        </div>
                    </div>
                </div>

            </Card>

            {activeView === 'list' ? (
            <Card>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-[#F0F0F1] dark:bg-surface-2">
                            <tr className="border-b border-line">
                                <th scope="col" className="h-10 w-12 px-3.5 text-left text-xs font-semibold text-ink-2">
                                    #
                                </th>
                                <th scope="col" className="h-9 px-3 text-left">
                                    {sortable('name', 'Name')}
                                </th>
                                <th scope="col" className="h-10 px-3 text-left text-xs font-semibold text-ink-2">
                                    Roles
                                </th>
                                <th scope="col" className="h-9 px-3 text-left">
                                    {sortable('is_active', 'Status')}
                                </th>
                                <th scope="col" className="h-9 px-3 text-left">
                                    {sortable('last_login_at', 'Last sign-in')}
                                </th>
                                <th scope="col" className="h-9 px-3 text-left">
                                    {sortable('created_at', 'Joined')}
                                </th>
                                <th scope="col" className="h-10 px-3.5 text-right text-xs font-semibold text-ink-2">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-3.5 py-14">
                                        <EmptyState
                                            icon={Users}
                                            title="No users found"
                                            description="Try a different search or filter."
                                        />
                                    </td>
                                </tr>
                            ) : (
                                users.data.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        className="border-b border-line/70 transition-colors last:border-b-0 hover:bg-surface-2"
                                    >
                                        <td className="num h-[60px] px-3.5 text-xs font-medium text-ink-2">{(users.from ?? 1) + index}</td>

                                        <td className="px-3">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={user.name} src={user.avatar_url} size="lg" className="size-10" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-medium text-ink">{user.name}</p>
                                                    <p className="truncate text-xs text-ink-3">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-3">
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles?.length ? (
                                                    user.roles.map((role) => (
                                                        <Badge key={role.id} tone="brand" size="sm">
                                                            {role.name.replace(/_/g, ' ')}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-2xs text-ink-3">None</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-3">
                                            <Badge tone={user.is_active ? 'ok' : 'neutral'} size="sm" dot>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>

                                        <td className="px-3">
                                            <span className="num text-2xs text-ink-2">
                                                {user.last_login_at ? shortDate(user.last_login_at) : 'Never'}
                                            </span>
                                        </td>

                                        <td className="px-3">
                                            <span className="inline-flex items-center gap-1.5 text-2xs text-ink-2">
                                                <CalendarDays className="size-3.5 text-ink-3" />
                                                <span className="num">{shortDate(user.created_at)}</span>
                                            </span>
                                        </td>

                                        <td className="px-3.5">
                                            <div className="flex items-center justify-end gap-0.5">
                                                {can.manage && (
                                                    <>
                                                        <Tooltip label={actionTooltip(user, 'reset')}>
                                                            <button
                                                                type="button"
                                                                aria-label={`Reset password for ${user.name}`}
                                                                onClick={() => setResetting(user)}
                                                                disabled={isSelf(user) || isProtectedTarget(user)}
                                                                className={cn(actionButton, (isSelf(user) || isProtectedTarget(user)) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}
                                                            >
                                                                <KeyRound />
                                                            </button>
                                                        </Tooltip>

                                                        <Tooltip label={actionTooltip(user, 'status')}>
                                                            <button
                                                                type="button"
                                                                aria-label={`Toggle status for ${user.name}`}
                                                                onClick={() => toggleStatus(user)}
                                                                disabled={isSelf(user) || isProtectedTarget(user)}
                                                                className={cn(actionButton, (isSelf(user) || isProtectedTarget(user)) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}
                                                            >
                                                                {user.is_active ? <LockOpen /> : <Lock />}
                                                            </button>
                                                        </Tooltip>
                                                    </>
                                                )}

                                                <Tooltip label="View">
                                                    <button
                                                        type="button"
                                                        aria-label={`View ${user.name}`}
                                                        onClick={() => setViewing(user)}
                                                        className={actionButton}
                                                    >
                                                        <Eye />
                                                    </button>
                                                </Tooltip>

                                                {can.manage && (
                                                    <>
                                                        <Tooltip label={actionTooltip(user, 'edit')}>
                                                            <button
                                                                type="button"
                                                                aria-label={`Edit ${user.name}`}
                                                                onClick={() => openEdit(user)}
                                                                disabled={isProtectedTarget(user)}
                                                                className={cn(actionButton, isProtectedTarget(user) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}
                                                            >
                                                                <Pencil />
                                                            </button>
                                                        </Tooltip>

                                                        <Tooltip label={actionTooltip(user, 'delete')}>
                                                            <button
                                                                type="button"
                                                                aria-label={`Delete ${user.name}`}
                                                                onClick={() => remove(user)}
                                                                disabled={isSelf(user) || isProtectedTarget(user)}
                                                                className={cn(
                                                                    actionButton,
                                                                    'hover:bg-bad-wash hover:text-bad',
                                                                    (isSelf(user) || isProtectedTarget(user)) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3',
                                                                )}
                                                            >
                                                                <Trash2 />
                                                            </button>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination meta={users} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} />
            </Card>
            ) : (
                <div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {users.data.map((user) => (
                            <Card key={user.id} className="p-4 transition-shadow duration-200 hover:shadow-pop">
                                <div className="flex items-center gap-3">
                                    <Avatar name={user.name} src={user.avatar_url} size="lg" className="size-12 rounded-lg text-sm" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                                        <p className="truncate text-2xs text-ink-3">{user.email}</p>
                                    </div>
                                    <Badge tone={user.is_active ? 'ok' : 'neutral'} size="sm" dot>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>

                                <div className="my-3 border-t border-line" />

                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-0.5">
                                        <Tooltip label="View"><button type="button" onClick={() => setViewing(user)} className={cn(actionButton, 'text-brand hover:bg-brand-wash hover:text-brand')}><Eye /></button></Tooltip>
                                        {can.manage && <>
                                            <Tooltip label={actionTooltip(user, 'edit')}><button type="button" onClick={() => openEdit(user)} disabled={isProtectedTarget(user)} className={cn(actionButton, 'text-warn hover:bg-warn-wash hover:text-warn', isProtectedTarget(user) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}><Pencil /></button></Tooltip>
                                            <Tooltip label={actionTooltip(user, 'reset')}><button type="button" onClick={() => setResetting(user)} disabled={isSelf(user) || isProtectedTarget(user)} className={cn(actionButton, 'text-brand hover:bg-brand-wash hover:text-brand', (isSelf(user) || isProtectedTarget(user)) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}><KeyRound /></button></Tooltip>
                                            <Tooltip label={actionTooltip(user, 'status')}><button type="button" onClick={() => toggleStatus(user)} disabled={isSelf(user) || isProtectedTarget(user)} className={cn(actionButton, 'text-warn hover:bg-warn-wash hover:text-warn', (isSelf(user) || isProtectedTarget(user)) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}>{user.is_active ? <Lock /> : <LockOpen />}</button></Tooltip>
                                            <Tooltip label={actionTooltip(user, 'delete')}><button type="button" onClick={() => remove(user)} disabled={isSelf(user) || isProtectedTarget(user)} className={cn(actionButton, 'text-bad hover:bg-bad-wash hover:text-bad', (isSelf(user) || isProtectedTarget(user)) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}><Trash2 /></button></Tooltip>
                                        </>}
                                    </div>
                                    {user.roles?.[0] ? (
                                        <Badge tone="brand" size="md" className="capitalize">{user.roles[0].name.replace(/_/g, ' ')}</Badge>
                                    ) : <Badge tone="neutral" size="md">No role</Badge>}
                                </div>
                            </Card>
                        ))}

                        {users.data.length === 0 && (
                            <div className="col-span-full py-12"><EmptyState icon={Users} title="No users found" description="Try a different search or filter." /></div>
                        )}
                    </div>
                    <Card className="mt-4"><Pagination meta={users} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} /></Card>
                </div>
            )}

            <UserModal open={formOpen} onClose={() => setFormOpen(false)} user={editing} roles={roles} />
            <ViewUserModal open={viewing !== null} onClose={() => setViewing(null)} user={viewing} />
            <ResetPasswordModal open={resetting !== null} onClose={() => setResetting(null)} user={resetting} />

            <Modal
                open={confirmation !== null}
                onClose={() => setConfirmation(null)}
                title={confirmation?.action === 'delete' ? 'Remove user' : `${confirmation?.user.is_active ? 'Deactivate' : 'Activate'} user`}
                width="sm"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmation(null)}>Cancel</Button>
                        <Button variant={confirmation?.action === 'delete' ? 'danger' : 'primary'} onClick={confirmAction}>
                            {confirmation?.action === 'delete' ? 'Remove user' : 'Confirm change'}
                        </Button>
                    </>
                }
            >
                <div className="flex gap-3">
                    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', confirmation?.action === 'delete' ? 'bg-bad-wash text-bad' : 'bg-brand-wash text-brand')}>
                        <AlertTriangle className="size-4" />
                    </span>
                    <div>
                        <p className="text-xs font-medium text-ink">
                            {confirmation?.action === 'delete'
                                ? `Remove ${confirmation.user.name} from the CRM?`
                                : `${confirmation?.user.is_active ? 'Deactivate' : 'Activate'} ${confirmation?.user.name}?`}
                        </p>
                        <p className="mt-1 text-2xs leading-5 text-ink-2">
                            {confirmation?.action === 'delete'
                                ? 'They will lose access immediately. Their activity history will be retained for audit purposes.'
                                : confirmation?.user.is_active
                                  ? 'They will no longer be able to sign in until the account is reactivated.'
                                  : 'They will regain access using their existing credentials.'}
                        </p>
                    </div>
                </div>
            </Modal>
        </AppLayout>
    );
}
