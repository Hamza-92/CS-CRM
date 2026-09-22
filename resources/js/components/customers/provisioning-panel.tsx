import { router, useForm } from '@inertiajs/react';
import { CheckCircle2, Circle, KeyRound, LoaderCircle, Play, RotateCcw, Settings2, XCircle } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { cn } from '@/lib/utils';
import type { CustomerInstanceSummary } from '@/types';

const tones = { queued: 'neutral', running: 'info', succeeded: 'ok', failed: 'bad', cancelled: 'neutral' } as const;
type AdminMode = 'start' | 'resume' | 'database' | 'reset' | null;

export function ProvisioningPanel({
    instance,
    canManage,
    adminName,
    adminEmail,
}: {
    instance: CustomerInstanceSummary;
    canManage: boolean;
    adminName: string;
    adminEmail: string;
}) {
    const run = instance.provisioning;
    const active = run?.status === 'queued' || run?.status === 'running';
    const completed = run?.steps.filter((step) => step.status === 'succeeded').length ?? 0;
    const total = run?.steps.length ?? 12;
    const [adminMode, setAdminMode] = useState<AdminMode>(null);
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        admin_name: adminName,
        admin_email: adminEmail,
        password: '',
        password_confirmation: '',
        step: '',
    });

    useEffect(() => {
        if (!active) return;
        const timer = window.setInterval(() => router.reload({ only: ['customer'] }), 3000);
        return () => window.clearInterval(timer);
    }, [active]);

    const openAdmin = (mode: Exclude<AdminMode, null>) => {
        clearErrors();
        setData({
            admin_name: adminName,
            admin_email: adminEmail,
            password: '',
            password_confirmation: '',
            step: mode === 'database' ? 'create_database' : '',
        });
        setAdminMode(mode);
    };
    const closeAdmin = () => {
        reset('password', 'password_confirmation');
        setAdminMode(null);
    };
    const submitAdmin = (event: FormEvent) => {
        event.preventDefault();
        const options = { preserveScroll: true, onSuccess: closeAdmin };
        if (adminMode === 'start') {
            post(`/instances/${instance.id}/provisioning`, options);
        } else if (adminMode === 'resume') {
            post(`/instances/${instance.id}/provisioning/resume`, options);
        } else if (adminMode === 'database') {
            post(`/instances/${instance.id}/provisioning/retry`, options);
        } else if (adminMode === 'reset') {
            put(`/instances/${instance.id}/administrator`, options);
        }
    };
    const retry = (step: string) => {
        if (step === 'create_database') {
            openAdmin('database');
            return;
        }
        if (step === 'configure_administrator') {
            openAdmin('resume');
            return;
        }
        router.post(`/instances/${instance.id}/provisioning/retry`, { step }, { preserveScroll: true });
    };

    return <>
        <div className="mt-3 rounded-lg border border-line bg-surface">
            <div className="flex flex-col gap-3 border-b border-line px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-ink">Customer setup</span>
                        {run && <Badge tone={tones[run.status]} size="sm">{run.status.replace('_', ' ')}</Badge>}
                        {run && <span className="num text-2xs text-ink-3">{completed}/{total} steps</span>}
                    </div>
                    <p className="mt-1 text-2xs text-ink-3">{run ? (active ? 'Setup is running automatically. Progress refreshes every few seconds.' : run.status === 'failed' ? run.error_message || 'Setup stopped at a failed step.' : 'Setup workflow completed.') : 'Hosting, CounterPOS, and the tenant administrator are configured in one guided setup.'}</p>
                </div>
                {canManage && <div className="flex shrink-0 flex-wrap gap-2">
                    {!run && <Button type="button" size="sm" onClick={() => openAdmin('start')}><Play /> Setup customer</Button>}
                    {run?.status === 'failed' && <Button type="button" size="sm" onClick={() => openAdmin('resume')}><RotateCcw /> Resume setup</Button>}
                    {run?.status === 'succeeded' && <Badge tone="ok" size="md">Ready</Badge>}
                    {instance.counterpos_tenant_id && !active && <Button type="button" variant="secondary" size="sm" onClick={() => openAdmin('reset')}><KeyRound /> Admin password</Button>}
                    {active && <Button type="button" size="sm" disabled><LoaderCircle className="animate-spin" /> Running</Button>}
                </div>}
            </div>

            {run && <div className="p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                    {run.steps.map((step, index) => <div key={step.key} className={cn('flex items-start gap-2 rounded-md border px-2.5 py-2', step.status === 'failed' ? 'border-bad-line bg-bad-wash' : 'border-line bg-surface-2')}>
                        <span className="mt-0.5 shrink-0">
                            {step.status === 'succeeded' ? <CheckCircle2 className="size-4 text-ok" /> : step.status === 'running' ? <LoaderCircle className="size-4 animate-spin text-info" /> : step.status === 'failed' ? <XCircle className="size-4 text-bad" /> : <Circle className="size-4 text-ink-3" />}
                        </span>
                        <span className="min-w-0 flex-1"><span className="block text-xs font-medium text-ink">{index + 1}. {step.label}</span>{step.message && <span className={cn('mt-0.5 block text-2xs', step.status === 'failed' ? 'text-bad' : 'text-ink-3')}>{step.message}</span>}</span>
                        {canManage && step.status === 'failed' && !active && <button type="button" onClick={() => retry(step.key)} className="text-2xs font-semibold text-brand hover:underline">Retry</button>}
                    </div>)}
                </div>

                {canManage && !active && <details className="mt-3 rounded-md border border-line bg-surface-2">
                    <summary className="flex cursor-pointer items-center gap-2 px-3 py-2 text-2xs font-semibold text-ink-2"><Settings2 className="size-3.5" /> Advanced controls</summary>
                    <div className="flex flex-wrap gap-2 border-t border-line p-3">
                        <Button type="button" variant="secondary" size="xs" onClick={() => retry('create_database')}>Re-run database setup</Button>
                        <Button type="button" variant="secondary" size="xs" onClick={() => retry('migrate')}>Run migrations</Button>
                        <Button type="button" variant="secondary" size="xs" onClick={() => retry('seed_template')}>Install starter data</Button>
                        <Button type="button" variant="secondary" size="xs" onClick={() => openAdmin('reset')}>Set administrator</Button>
                        <Button type="button" variant="secondary" size="xs" onClick={() => retry('test_connection')}>Test and continue</Button>
                        <Button type="button" variant="secondary" size="xs" onClick={() => retry('activate')}>Activate tenant</Button>
                    </div>
                </details>}
            </div>}
        </div>

        <Modal
            open={adminMode !== null}
            onClose={closeAdmin}
            title={adminMode === 'reset' ? 'Tenant administrator password' : adminMode === 'database' ? 'Re-run database setup' : 'Tenant administrator'}
            width="sm"
            footer={<>
                <Button type="button" variant="secondary" onClick={closeAdmin} disabled={processing}>Cancel</Button>
                <Button type="submit" form="tenant-administrator-form" disabled={processing}>
                    {processing && <LoaderCircle className="animate-spin" />}
                    {adminMode === 'reset' ? 'Update password' : adminMode === 'resume' ? 'Resume setup' : adminMode === 'database' ? 'Re-run database setup' : 'Start setup'}
                </Button>
            </>}
        >
            <form id="tenant-administrator-form" onSubmit={submitAdmin} noValidate className="space-y-4">
                <p className="text-xs leading-relaxed text-ink-3">The password is sent through the signed server connection and stored only as a tenant password hash. It is not written to CRM operation history.</p>
                <Field label="Administrator name" error={errors.admin_name} required>
                    {(props) => <Input {...props} value={data.admin_name} onChange={(event) => setData('admin_name', event.target.value)} autoComplete="name" />}
                </Field>
                <Field label="Administrator email" error={errors.admin_email} required>
                    {(props) => <Input {...props} type="email" value={data.admin_email} onChange={(event) => setData('admin_email', event.target.value)} autoComplete="email" />}
                </Field>
                <Field label="Password" error={errors.password} hint="Minimum 12 characters" required>
                    {(props) => <Input {...props} type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} autoComplete="new-password" />}
                </Field>
                <Field label="Confirm password" error={errors.password_confirmation} required>
                    {(props) => <Input {...props} type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} autoComplete="new-password" />}
                </Field>
            </form>
        </Modal>
    </>;
}
