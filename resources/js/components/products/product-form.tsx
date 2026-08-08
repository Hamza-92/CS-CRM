import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Textarea, Toggle } from '@/components/ui/field';
import type { Product, RoleRef, UserRef } from '@/types';

interface ProductFormValues {
    name: string;
    code: string;
    description: string;
    is_active: boolean;
    technical_owner_id: string;
    support_role_id: string;
    default_trial_days: string;
    demo_notes: string;
}

export function ProductForm({
    product,
    owners,
    roles,
    action,
    method,
    submitLabel,
}: {
    product?: Product;
    owners: UserRef[];
    roles: RoleRef[];
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
}) {
    const { data, setData, post, put, processing, errors } = useForm<ProductFormValues>({
        name: product?.name ?? '',
        code: product?.code ?? '',
        description: product?.description ?? '',
        is_active: product?.is_active ?? true,
        technical_owner_id: product?.technical_owner_id ? String(product.technical_owner_id) : '',
        support_role_id: product?.support_role_id ? String(product.support_role_id) : '',
        default_trial_days: product?.default_trial_days ? String(product.default_trial_days) : '',
        demo_notes: product?.demo_notes ?? '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        (method === 'post' ? post : put)(action);
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <Card>
                <CardHeader title="Details" />
                <CardBody className="grid gap-4 sm:grid-cols-3">
                    <Field label="Name" error={errors.name} required className="sm:col-span-2">
                        {(props) => (
                            <Input {...props} value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        )}
                    </Field>

                    <Field label="Code" error={errors.code} required>
                        {(props) => (
                            <Input
                                {...props}
                                placeholder="CPOS"
                                className="num uppercase"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Description" error={errors.description} className="sm:col-span-3">
                        {(props) => (
                            <Textarea
                                {...props}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                        )}
                    </Field>

                    <div className="sm:col-span-3">
                        <Toggle
                            label="Active"
                            hint="Inactive products stay in history but cannot be selected for new subscriptions."
                            error={errors.is_active}
                            checked={data.is_active}
                            onChange={(checked) => setData('is_active', checked)}
                        />
                    </div>
                </CardBody>
            </Card>

            <Card>
                <CardHeader title="Responsibility" meta="Decides who receives product work" />
                <CardBody className="grid gap-4 sm:grid-cols-2">
                    <Field label="Technical owner" error={errors.technical_owner_id}>
                        {(props) => (
                            <Select
                                {...props}
                                value={data.technical_owner_id}
                                onChange={(e) => setData('technical_owner_id', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {owners.map((owner) => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>

                    <Field label="Support team" error={errors.support_role_id}>
                        {(props) => (
                            <Select
                                {...props}
                                value={data.support_role_id}
                                onChange={(e) => setData('support_role_id', e.target.value)}
                            >
                                <option value="">Unassigned</option>
                                {roles.map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>
                </CardBody>
            </Card>

            <Card>
                <CardHeader title="Demo defaults" />
                <CardBody className="grid gap-4 sm:grid-cols-3">
                    <Field label="Trial length (days)" error={errors.default_trial_days}>
                        {(props) => (
                            <Input
                                {...props}
                                type="number"
                                min={1}
                                max={365}
                                className="num"
                                value={data.default_trial_days}
                                onChange={(e) => setData('default_trial_days', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Setup notes" error={errors.demo_notes} className="sm:col-span-3">
                        {(props) => (
                            <Textarea
                                {...props}
                                rows={2}
                                value={data.demo_notes}
                                onChange={(e) => setData('demo_notes', e.target.value)}
                            />
                        )}
                    </Field>
                </CardBody>
                <CardFooter>
                    <Link href={product ? `/products/${product.id}` : '/products'}>
                        <Button variant="secondary">Cancel</Button>
                    </Link>
                    <Button type="submit" disabled={processing}>
                        {processing && <LoaderCircle className="animate-spin" />}
                        {submitLabel}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    );
}
