import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import type { ManagedUser } from '@/types';

export function ResetPasswordModal({
    open,
    onClose,
    user,
}: {
    open: boolean;
    onClose: () => void;
    user: ManagedUser | null;
}) {
    const { data, setData, put, processing, errors, reset, clearErrors } = useForm({
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (open) {
            clearErrors();
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user?.id]);

    function submit(event: FormEvent) {
        event.preventDefault();

        if (!user) {
            return;
        }

        put(`/users/${user.id}/password`, {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Reset Password"
            width="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="submit" form="reset-password-form" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Reset
                    </Button>
                </>
            }
        >
            <form id="reset-password-form" onSubmit={submit} noValidate className="space-y-4">
                <p className="text-xs text-ink-2">
                    Set a new password for <span className="font-medium text-ink">{user?.name}</span>. They are not
                    notified — share it with them directly.
                </p>

                <Field label="New password" error={errors.password} required>
                    {(props) => (
                        <Input
                            {...props}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Enter Password"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                        />
                    )}
                </Field>

                <Field label="Confirm password" error={errors.password_confirmation} required>
                    {(props) => (
                        <Input
                            {...props}
                            type="password"
                            autoComplete="new-password"
                            placeholder="Confirm Password"
                            value={data.password_confirmation}
                            onChange={(event) => setData('password_confirmation', event.target.value)}
                        />
                    )}
                </Field>
            </form>
        </Modal>
    );
}
