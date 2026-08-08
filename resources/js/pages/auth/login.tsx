import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { CheckboxField, Field, Input } from '@/components/ui/field';
import AuthLayout from '@/layouts/auth-layout';

export default function Login({ status }: { status?: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    }

    return (
        <AuthLayout title="Log in to your account" description="Enter your credentials to access your account">
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-md border border-ok/20 bg-ok-wash px-3 py-2 text-xs font-medium text-ok">
                    {status}
                </div>
            )}

            <form onSubmit={submit} noValidate className="space-y-4">
                <Field label="Email address" error={errors.email} required>
                    {(props) => (
                        <Input
                            {...props}
                            type="email"
                            name="email"
                            autoComplete="username"
                            autoFocus
                            placeholder="company@example.com"
                            className="h-11"
                            value={data.email}
                            onChange={(event) => setData('email', event.target.value)}
                        />
                    )}
                </Field>

                <Field label="Password" error={errors.password} required>
                    {(props) => (
                        <Input
                            {...props}
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            className="h-11"
                            value={data.password}
                            onChange={(event) => setData('password', event.target.value)}
                        />
                    )}
                </Field>

                <CheckboxField
                    label="Remember me"
                    checked={data.remember}
                    onChange={(checked) => setData('remember', checked)}
                />

                <Button type="submit" size="lg" disabled={processing} className="h-11 w-full font-semibold">
                    {processing && <LoaderCircle className="animate-spin" />}
                    Login
                </Button>
            </form>
        </AuthLayout>
    );
}
