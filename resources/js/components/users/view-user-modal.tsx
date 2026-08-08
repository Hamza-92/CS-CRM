import { Avatar } from '@/components/ui/avatar';
import { Badge, StatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import type { ManagedUser } from '@/types';
import { dateTime, shortDate } from '@/lib/format';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-baseline justify-between gap-4 py-2">
            <dt className="shrink-0 text-2xs text-ink-3">{label}</dt>
            <dd className="min-w-0 truncate text-right text-xs text-ink">{children}</dd>
        </div>
    );
}

export function ViewUserModal({
    open,
    onClose,
    user,
}: {
    open: boolean;
    onClose: () => void;
    user: ManagedUser | null;
}) {
    return (
        <Modal
            open={open}
            onClose={onClose}
            title="User Details"
            width="sm"
            footer={
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            }
        >
            {user && (
                <div>
                    <div className="flex items-center gap-3 border-b border-line pb-4">
                        <Avatar name={user.name} src={user.avatar_url} size="lg" className="size-11 text-sm" />
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-ink">{user.name}</p>
                            <p className="truncate text-2xs text-ink-3">{user.email}</p>
                        </div>
                    </div>

                    <dl className="divide-y divide-line/70">
                        <Row label="Status">
                            <StatusBadge active={user.is_active} />
                        </Row>
                        <Row label="Role">
                            {user.roles?.length ? (
                                <span className="flex flex-wrap justify-end gap-1">
                                    {user.roles.map((role) => (
                                        <Badge key={role.id} tone="brand" size="sm">
                                            {role.name.replace(/_/g, ' ')}
                                        </Badge>
                                    ))}
                                </span>
                            ) : (
                                <span className="text-ink-3">None</span>
                            )}
                        </Row>
                        <Row label="Job title">{user.job_title ?? <span className="text-ink-3">—</span>}</Row>
                        <Row label="Phone">
                            {user.phone ? <span className="num">{user.phone}</span> : <span className="text-ink-3">—</span>}
                        </Row>
                        <Row label="Last sign-in">
                            <span className="num">{user.last_login_at ? dateTime(user.last_login_at) : 'Never'}</span>
                        </Row>
                        <Row label="Joined">
                            <span className="num">{shortDate(user.created_at)}</span>
                        </Row>
                    </dl>
                </div>
            )}
        </Modal>
    );
}
