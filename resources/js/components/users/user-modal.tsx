import { useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { type FormEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';
import { Modal } from '@/components/ui/modal';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { ManagedUser, RoleOption } from '@/types';

interface Values {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    job_title: string;
    phone: string;
    role: string;
    [key: string]: string;
}

export function UserModal({
    open,
    onClose,
    user,
    roles,
}: {
    open: boolean;
    onClose: () => void;
    user?: ManagedUser | null;
    roles: RoleOption[];
}) {
    const editing = Boolean(user);

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<Values>({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        job_title: '',
        phone: '',
        role: '',
    });

    useEffect(() => {
        if (!open) {
            return;
        }

        clearErrors();
        setData({
            name: user?.name ?? '',
            email: user?.email ?? '',
            password: '',
            password_confirmation: '',
            job_title: user?.job_title ?? '',
            phone: user?.phone ?? '',
            role: user?.roles?.[0]?.name ?? '',
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, user?.id]);

    function submit(event: FormEvent) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                onClose();
            },
        };

        if (editing && user) {
            put(`/users/${user.id}`, options);

            return;
        }

        post('/users', options);
    }

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={editing ? 'Edit User' : 'Add User'}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={processing}>
                        Cancel
                    </Button>
                    <Button type="submit" form="user-form" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Save
                    </Button>
                </>
            }
        >
            <form id="user-form" onSubmit={submit} noValidate className="space-y-4">
                <Field label="Name" error={errors.name} required>
                    {(props) => (
                        <Input
                            {...props}
                            placeholder="eg. John Smith"
                            value={data.name}
                            onChange={(event) => setData('name', event.target.value)}
                        />
                    )}
                </Field>

                <Field label="Email" error={errors.email} required>
                    {(props) => (
                        <Input
                            {...props}
                            type="email"
                            autoComplete="off"
                            placeholder="eg. john@example.com"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                        />
                    )}
                </Field>

                {!editing && (
                    <>
                        <Field label="Password" error={errors.password} required>
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

                        <Field label="Confirm Password" error={errors.password_confirmation} required>
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
                    </>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Job title" error={errors.job_title}>
                        {(props) => (
                            <Input
                                {...props}
                                placeholder="eg. Sales Manager"
                                value={data.job_title}
                                onChange={(event) => setData('job_title', event.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Phone" error={errors.phone}>
                        {(props) => (
                            <Input
                                {...props}
                                className="num"
                                placeholder="eg. 0300 1234567"
                                value={data.phone}
                                onChange={(event) => setData('phone', event.target.value)}
                            />
                        )}
                    </Field>
                </div>

                <Field label="Role" error={errors.role} required>
                    {(props) => (
                        <SearchableSelect
                            id={props.id}
                            invalid={props['aria-invalid']}
                            describedBy={props['aria-describedby']}
                            options={roles.map((role) => ({ value: role.value, label: role.label }))}
                            value={data.role}
                            onChange={(value) => setData('role', value)}
                            placeholder="Select Role"
                        />
                    )}
                </Field>
            </form>
        </Modal>
    );
}
