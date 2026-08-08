import { Head, router } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Eye, History, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/empty-state';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { Tooltip } from '@/components/ui/tooltip';
import { useFilters } from '@/hooks/use-filters';
import AppLayout from '@/layouts/app-layout';
import type { Activity, Paginated } from '@/types';
import { dateTime } from '@/lib/format';

interface Props {
    loginHistory: Paginated<Activity>;
    filters: { search: string; per_page: number };
}

const actionButton = 'flex size-8 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-surface-3 hover:text-ink [&_svg]:size-4';

function dateOnly(value: string) {
    return new Date(value).toISOString().slice(0, 10);
}

export default function LoginHistoryIndex({ loginHistory, filters }: Props) {
    const { values, set } = useFilters('/login-history', { search: filters.search, per_page: filters.per_page });
    const [viewing, setViewing] = useState<Activity | null>(null);

    return (
        <AppLayout>
            <Head title="Login History" />

            <PageHeader
                title="Login History"
                description="Manage your login history records."
                actions={<Button variant="secondary" onClick={() => router.visit('/users')}><ArrowLeft /> Back to Users</Button>}
            />

            <Card className="mb-4 p-4">
                <div className="relative w-full max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-ink-3" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        aria-label="Search login history"
                        className="pl-9"
                        value={values.search ?? ''}
                        onChange={(event) => set('search', event.target.value, 300)}
                    />
                </div>
            </Card>

            <Card>
                {loginHistory.data.length === 0 ? (
                    <div className="px-4 py-14"><EmptyState icon={History} title="No login history found" description="Login records will appear here when users sign in." /></div>
                ) : (
                    <div className="w-full overflow-hidden">
                        <table className="w-full border-collapse">
                            <thead className="bg-[#F0F0F1] dark:bg-surface-2">
                                <tr className="border-b border-line">
                                    <th className="h-10 w-12 px-3.5 text-left text-xs font-semibold text-ink-2">#</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">User</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">User Type</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">IP Address</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">Login Date</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-ink-2">Details</th>
                                    <th className="h-10 px-3.5 text-right text-xs font-semibold text-ink-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loginHistory.data.map((activity, index) => {
                                    const user = activity.user;
                                    const role = user?.roles?.[0]?.name?.replace(/_/g, ' ') ?? '—';

                                    return (
                                        <tr key={activity.id} className="border-b border-line/70 last:border-b-0 hover:bg-surface-2">
                                            <td className="num h-[60px] px-3.5 text-xs font-medium text-ink-2">{(loginHistory.from ?? 1) + index}</td>
                                            <td className="px-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-ink">{user?.name ?? 'System'}</p>
                                                    <p className="truncate text-sm text-ink-3">{user?.email ?? '—'}</p>
                                                </div>
                                            </td>
                                            <td className="px-3 text-xs capitalize text-ink">{role}</td>
                                            <td className="num px-3 text-xs text-ink">{activity.ip_address ?? '—'}</td>
                                            <td className="px-3">
                                                <span className="inline-flex items-center gap-2 text-xs text-ink-2"><CalendarDays className="size-4 text-ink-3" />{dateOnly(activity.created_at)}</span>
                                            </td>
                                            <td className="px-3 text-xs text-ink">
                                                <span className="block">Browser session</span>
                                                <span className="block text-xs text-ink-3">Web client</span>
                                            </td>
                                            <td className="px-3.5">
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <Tooltip label="View"><button type="button" aria-label={`View login for ${user?.name ?? 'user'}`} onClick={() => setViewing(activity)} className={actionButton}><Eye /></button></Tooltip>
                                                    <Tooltip label="Audit records are retained"><button type="button" aria-label="Audit records are retained" disabled className={`${actionButton} opacity-45`}><Trash2 /></button></Tooltip>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination meta={loginHistory} perPage={Number(values.per_page ?? 10)} onPerPageChange={(value) => set('per_page', value)} />
            </Card>

            <Modal open={viewing !== null} onClose={() => setViewing(null)} title="Login Details" width="lg" footer={null}>
                {viewing && (
                    <dl className="divide-y divide-line">
                        <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-ink-2">User</dt><dd className="text-sm font-medium text-ink">{viewing.user?.name ?? 'System'}</dd></div>
                        <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-ink-2">Email</dt><dd className="text-sm font-medium text-ink">{viewing.user?.email ?? '—'}</dd></div>
                        <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-ink-2">User Type</dt><dd className="text-sm font-medium capitalize text-ink">{viewing.user?.roles?.[0]?.name?.replace(/_/g, ' ') ?? '—'}</dd></div>
                        <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-ink-2">IP Address</dt><dd className="num text-sm font-medium text-ink">{viewing.ip_address ?? '—'}</dd></div>
                        <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-ink-2">Login Date</dt><dd className="num text-sm font-medium text-ink">{dateOnly(viewing.created_at)}</dd></div>
                        <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-ink-2">Recorded</dt><dd className="num text-sm font-medium text-ink">{dateTime(viewing.created_at)}</dd></div>
                    </dl>
                )}
            </Modal>
        </AppLayout>
    );
}
