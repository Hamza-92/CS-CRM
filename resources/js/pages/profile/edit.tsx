import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { PageHeader } from '@/components/page-header';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import AppLayout from '@/layouts/app-layout';
import { dateTime, shortDate } from '@/lib/format';

interface Props {
    profile: {
        id: number;
        name: string;
        email: string;
        job_title: string | null;
        phone: string | null;
        roles: string[];
        last_login_at: string | null;
        created_at: string;
    };
}

function DetailsForm({ profile }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: profile.name,
        email: profile.email,
        job_title: profile.job_title ?? '',
        phone: profile.phone ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        put('/profile', { preserveScroll: true });
    }

    return (
        <form onSubmit={submit} noValidate>
            <Card>
                <CardHeader title="Your details" />
                <CardBody className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full name" error={errors.name} required>
                        {(props) => (
                            <Input {...props} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        )}
                    </Field>

                    <Field label="Email" error={errors.email} required>
                        {(props) => (
                            <Input
                                {...props}
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Job title" error={errors.job_title}>
                        {(props) => (
                            <Input {...props} value={data.job_title} onChange={(e) => setData('job_title', e.target.value)} />
                        )}
                    </Field>

                    <Field label="Phone" error={errors.phone}>
                        {(props) => (
                            <Input {...props} className="num" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        )}
                    </Field>
                </CardBody>
                <CardFooter>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Save details
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

function PasswordForm() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <form onSubmit={submit} noValidate>
            <Card>
                <CardHeader title="Password" />
                <CardBody className="grid gap-4 sm:grid-cols-2">
                    <Field label="Current password" error={errors.current_password} required className="sm:col-span-2">
                        {(props) => (
                            <Input
                                {...props}
                                type="password"
                                autoComplete="current-password"
                                value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="New password" error={errors.password} required>
                        {(props) => (
                            <Input
                                {...props}
                                type="password"
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Confirm new password" error={errors.password_confirmation} required>
                        {(props) => (
                            <Input
                                {...props}
                                type="password"
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                            />
                        )}
                    </Field>
                </CardBody>
                <CardFooter>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        Update password
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}

export default function ProfileEdit({ profile }: Props) {
    return (
        <AppLayout>
            <Head title="Profile" />

            <PageHeader title="Profile" />

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <DetailsForm profile={profile} />
                    <PasswordForm />
                </div>

                <Card className="h-fit">
                    <CardBody className="flex flex-col items-center gap-2 border-b border-line py-5 text-center">
                        <Avatar name={profile.name} size="lg" className="size-14 text-base" />
                        <div>
                            <p className="text-xs font-semibold text-ink">{profile.name}</p>
                            <p className="text-2xs text-ink-3">{profile.email}</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-1">
                            {profile.roles.map((role) => (
                                <Badge key={role} tone="brand" size="sm">
                                    {role.replace(/_/g, ' ')}
                                </Badge>
                            ))}
                        </div>
                    </CardBody>
                    <CardBody className="py-2">
                        <dl className="divide-y divide-line/70">
                            <div className="flex items-baseline justify-between gap-3 py-1.5">
                                <dt className="text-2xs text-ink-3">Last sign-in</dt>
                                <dd className="num text-xs text-ink">
                                    {profile.last_login_at ? dateTime(profile.last_login_at) : '—'}
                                </dd>
                            </div>
                            <div className="flex items-baseline justify-between gap-3 py-1.5">
                                <dt className="text-2xs text-ink-3">Member since</dt>
                                <dd className="num text-xs text-ink">{shortDate(profile.created_at)}</dd>
                            </div>
                        </dl>
                    </CardBody>
                </Card>
            </div>
        </AppLayout>
    );
}
