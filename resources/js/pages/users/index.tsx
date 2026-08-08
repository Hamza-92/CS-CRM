import { Head, router } from '@inertiajs/react';
import { CalendarDays, Eye, KeyRound, Lock, LockOpen, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader, Toolbar } from '@/components/page-header';
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
import { Tooltip } from '@/components/ui/tooltip';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { ManagedUser, Paginated, RoleOption } from '@/types';
import { shortDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
    users: Paginated<ManagedUser>;
    roles: RoleOption[];
    filters: { search: string; status: string; role: string; sort: string; direction: 'asc' | 'desc' };
    can: { create: boolean; manage: boolean };
}

const actionButton =
    'flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-4';

export default function UsersIndex({ users, roles, filters, can }: Props) {
    const { values, set, setMany } = useFilters('/users', {
        search: filters.search,
        status: filters.status,
        role: filters.role,
        sort: filters.sort,
        direction: filters.direction,
    });

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ManagedUser | null>(null);
    const [viewing, setViewing] = useState<ManagedUser | null>(null);
    const [resetting, setResetting] = useState<ManagedUser | null>(null);

    function openCreate() {
        setEditing(null);
        setFormOpen(true);
    }

    function openEdit(user: ManagedUser) {
        setEditing(user);
        setFormOpen(true);
    }

    function toggleStatus(user: ManagedUser) {
        const next = user.is_active ? 'Deactivate' : 'Activate';

        if (confirm(`${next} ${user.name}?`)) {
            router.patch(`/users/${user.id}/status`, {}, { preserveScroll: true });
        }
    }

    function remove(user: ManagedUser) {
        if (confirm(`Delete ${user.name}? Their activity history is kept.`)) {
            router.delete(`/users/${user.id}`, { preserveScroll: true });
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
                    'eyebrow inline-flex items-center gap-1',
                    isSorted ? 'text-ink' : 'text-ink-3 hover:text-ink-2',
                )}
            >
                {label}
                <span aria-hidden="true" className="text-[8px]">
                    {isSorted ? (filters.direction === 'asc' ? '▲' : '▼') : '⇅'}
                </span>
            </button>
        );
    }

    return (
        <AppLayout>
            <Head title="Users" />

            <PageHeader
                title="Users"
                badge={
                    <Badge tone="neutral" size="sm">
                        {users.total}
                    </Badge>
                }
                actions={
                    can.create && (
                        <Button onClick={openCreate}>
                            <Plus />
                            Add User
                        </Button>
                    )
                }
            />

            <Card>
                <Toolbar>
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
                            options={[
                                { value: '', label: 'All roles' },
                                ...roles.map((role) => ({ value: role.value, label: role.label })),
                            ]}
                            value={values.role ?? ''}
                            onChange={(value) => set('role', value)}
                            placeholder="All roles"
                            searchPlaceholder="Search roles..."
                        />
                    </div>

                    <div className="w-36">
                        <SearchableSelect
                            options={[
                                { value: '', label: 'All statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                            ]}
                            value={values.status ?? ''}
                            onChange={(value) => set('status', value)}
                            placeholder="All statuses"
                            searchPlaceholder="Search..."
                        />
                    </div>
                </Toolbar>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead className="bg-surface-2">
                            <tr className="border-b border-line">
                                <th scope="col" className="eyebrow h-9 w-12 px-3.5 text-left text-ink-3">
                                    #
                                </th>
                                <th scope="col" className="h-9 px-3 text-left">
                                    {sortable('name', 'Name')}
                                </th>
                                <th scope="col" className="eyebrow h-9 px-3 text-left text-ink-3">
                                    Roles
                                </th>
                                <th scope="col" className="h-9 px-3 text-left">
                                    {sortable('created_at', 'Joined')}
                                </th>
                                <th scope="col" className="eyebrow h-9 px-3.5 text-right text-ink-3">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-3.5 py-10">
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
                                        <td className="num h-14 px-3.5 text-2xs text-ink-3">{(users.from ?? 1) + index}</td>

                                        <td className="px-3">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar name={user.name} size="lg" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                                                    <p className="truncate text-2xs text-ink-3">{user.email}</p>
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
                                            <span className="inline-flex items-center gap-1.5 text-2xs text-ink-2">
                                                <CalendarDays className="size-3.5 text-ink-3" />
                                                <span className="num">{shortDate(user.created_at)}</span>
                                            </span>
                                        </td>

                                        <td className="px-3.5">
                                            <div className="flex items-center justify-end gap-0.5">
                                                {can.manage && (
                                                    <>
                                                        <Tooltip label="Reset password">
                                                            <button
                                                                type="button"
                                                                aria-label={`Reset password for ${user.name}`}
                                                                onClick={() => setResetting(user)}
                                                                className={actionButton}
                                                            >
                                                                <KeyRound />
                                                            </button>
                                                        </Tooltip>

                                                        <Tooltip label={user.is_active ? 'Deactivate' : 'Activate'}>
                                                            <button
                                                                type="button"
                                                                aria-label={`Toggle status for ${user.name}`}
                                                                onClick={() => toggleStatus(user)}
                                                                className={actionButton}
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
                                                        <Tooltip label="Edit">
                                                            <button
                                                                type="button"
                                                                aria-label={`Edit ${user.name}`}
                                                                onClick={() => openEdit(user)}
                                                                className={actionButton}
                                                            >
                                                                <Pencil />
                                                            </button>
                                                        </Tooltip>

                                                        <Tooltip label="Delete">
                                                            <button
                                                                type="button"
                                                                aria-label={`Delete ${user.name}`}
                                                                onClick={() => remove(user)}
                                                                className={cn(
                                                                    actionButton,
                                                                    'hover:bg-bad-wash hover:text-bad',
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

                <Pagination meta={users} />
            </Card>

            <UserModal open={formOpen} onClose={() => setFormOpen(false)} user={editing} roles={roles} />
            <ViewUserModal open={viewing !== null} onClose={() => setViewing(null)} user={viewing} />
            <ResetPasswordModal open={resetting !== null} onClose={() => setResetting(null)} user={resetting} />
        </AppLayout>
    );
}
