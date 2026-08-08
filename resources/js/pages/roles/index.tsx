import { Head, router } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    ChevronsUpDown,
    KeyRound,
    Pencil,
    Plus,
    Search,
    ShieldCheck,
    Trash2,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { ManagedRole, Paginated } from '@/types';
import { shortDate } from '@/lib/format';
import { cn } from '@/lib/utils';

interface Props {
    roles: Paginated<ManagedRole>;
    filters: { search: string; sort: string; direction: 'asc' | 'desc'; per_page: number };
    can: { manage: boolean };
}

const actionButton =
    'flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-4';

export default function RolesIndex({ roles, filters, can }: Props) {
    const { values, set, setMany } = useFilters('/roles', {
        search: filters.search,
        sort: filters.sort,
        direction: filters.direction,
        per_page: filters.per_page,
    });
    const [confirmation, setConfirmation] = useState<ManagedRole | null>(null);

    function openCreate() {
        router.visit('/roles/create');
    }

    function openEdit(role: ManagedRole) {
        if (role.is_protected) return;

        router.visit(`/roles/${role.id}/edit`);
    }

    function sortable(column: string, label: string) {
        const isSorted = filters.sort === column;

        return (
            <button
                type="button"
                onClick={() => setMany({ sort: column, direction: isSorted && filters.direction === 'asc' ? 'desc' : 'asc' })}
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

    function confirmDelete() {
        if (!confirmation) return;

        router.delete(`/roles/${confirmation.id}`, {
            preserveScroll: true,
            onFinish: () => setConfirmation(null),
        });
    }

    return (
        <AppLayout>
            <Head title="Roles & Permissions" />

            <PageHeader
                title="Roles & Permissions"
                actions={can.manage && (
                    <Button onClick={openCreate}>
                        <Plus />
                        Add Role
                    </Button>
                )}
            />

            <Card>
                <div className="border-b border-line p-3.5">
                    <div className="relative w-full max-w-xs">
                        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                        <Input
                            type="search"
                            placeholder="Search roles"
                            aria-label="Search roles"
                            className="pl-8"
                            value={values.search ?? ''}
                            onChange={(event) => set('search', event.target.value, 300)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] table-fixed text-left">
                        <thead className="bg-surface-2">
                            <tr className="border-b border-line">
                                <th className="w-12 px-3.5 py-2.5 text-xs font-semibold text-ink-3">#</th>
                                <th className="px-3.5 py-2.5">{sortable('name', 'Role')}</th>
                                <th className="w-28 px-3.5 py-2.5 text-xs font-semibold text-ink-3">Type</th>
                                <th className="w-32 px-3.5 py-2.5">{sortable('users_count', 'Users')}</th>
                                <th className="w-36 px-3.5 py-2.5 text-xs font-semibold text-ink-3">Permissions</th>
                                <th className="w-32 px-3.5 py-2.5">{sortable('updated_at', 'Updated')}</th>
                                <th className="w-24 px-3.5 py-2.5 text-right text-xs font-semibold text-ink-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8">
                                        <EmptyState icon={KeyRound} title="No roles found" />
                                    </td>
                                </tr>
                            ) : roles.data.map((role, index) => (
                                <tr key={role.id} className="border-b border-line last:border-b-0 hover:bg-surface-2/60">
                                    <td className="px-3.5 py-3 text-xs text-ink-2">{(roles.current_page - 1) * roles.per_page + index + 1}</td>
                                    <td className="px-3.5 py-3">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span className={cn(
                                                'flex size-8 shrink-0 items-center justify-center rounded-md',
                                                role.is_protected ? 'bg-brand-wash text-brand' : 'bg-surface-3 text-ink-3',
                                            )}>
                                                {role.is_protected ? <ShieldCheck className="size-4" /> : <KeyRound className="size-4" />}
                                            </span>
                                            <span className="truncate text-xs font-semibold text-ink">{role.label}</span>
                                        </div>
                                    </td>
                                    <td className="px-3.5 py-3">
                                        <Badge tone={role.is_system ? 'neutral' : 'brand'}>{role.is_system ? 'System' : 'Custom'}</Badge>
                                    </td>
                                    <td className="px-3.5 py-3">
                                        <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                                            <UsersRound className="size-3.5 text-ink-3" />
                                            <span className="num">{role.users_count}</span>
                                        </span>
                                    </td>
                                    <td className="px-3.5 py-3 text-xs text-ink-2">
                                        {role.is_protected ? 'All permissions' : <><span className="num">{role.permissions_count}</span> granted</>}
                                    </td>
                                    <td className="px-3.5 py-3 text-xs text-ink-2">{role.updated_at ? shortDate(role.updated_at) : '—'}</td>
                                    <td className="px-3.5 py-3">
                                        <div className="flex items-center justify-end gap-0.5">
                                            <Tooltip label={role.is_protected ? 'Super Admin is protected' : 'Edit role'}>
                                                <button
                                                    type="button"
                                                    aria-label={`Edit ${role.label}`}
                                                    disabled={role.is_protected}
                                                    onClick={() => openEdit(role)}
                                                    className={cn(actionButton, role.is_protected && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}
                                                >
                                                    <Pencil />
                                                </button>
                                            </Tooltip>
                                            <Tooltip label={role.is_system ? 'System roles cannot be deleted' : role.users_count ? 'Remove assigned users first' : 'Delete role'}>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${role.label}`}
                                                    disabled={role.is_system || role.users_count > 0}
                                                    onClick={() => setConfirmation(role)}
                                                    className={cn(actionButton, 'hover:bg-bad-wash hover:text-bad', (role.is_system || role.users_count > 0) && 'cursor-not-allowed opacity-35 hover:bg-transparent hover:text-ink-3')}
                                                >
                                                    <Trash2 />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    meta={roles}
                    perPage={filters.per_page}
                    onPerPageChange={(value) => set('per_page', value)}
                />
            </Card>

            <Modal
                open={Boolean(confirmation)}
                onClose={() => setConfirmation(null)}
                title="Delete role"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfirmation(null)}>Cancel</Button>
                        <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                    </>
                }
            >
                <p className="text-xs text-ink-2">Delete {confirmation?.label}? This cannot be undone.</p>
            </Modal>
        </AppLayout>
    );
}
