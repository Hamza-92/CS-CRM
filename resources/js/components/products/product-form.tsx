import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Textarea, Toggle } from '@/components/ui/field';
import { SearchableSelect } from '@/components/ui/searchable-select';
import type { Product, RoleRef, UserRef } from '@/types';

interface ProductFormValues {
    name: string;
    code: string;
    brand_color: string;
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
        brand_color: product?.brand_color ?? '#3B82F6',
        description: product?.description ?? '',
        is_active: product?.is_active ?? true,
        technical_owner_id: product?.technical_owner_id ? String(product.technical_owner_id) : '',
        support_role_id: product?.support_role_id ? String(product.support_role_id) : '',
        default_trial_days: product?.default_trial_days ? String(product.default_trial_days) : '',
        demo_notes: product?.demo_notes ?? '',
    });

    const ownerOptions = [
        { value: '', label: 'Unassigned' },
        ...owners.map((owner) => ({ value: String(owner.id), label: owner.name, hint: owner.email })),
    ];
    const supportRoleOptions = [
        { value: '', label: 'Unassigned' },
        ...roles.map((role) => ({ value: String(role.id), label: role.name.replace(/_/g, ' ') })),
    ];

    function submit(event: FormEvent) {
        event.preventDefault();
        (method === 'post' ? post : put)(action);
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <Card>
                <CardHeader title="Details" />
                <CardBody className="grid gap-4 sm:grid-cols-4">
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

                    <Field label="Product color" error={errors.brand_color} hint="Used for the product avatar and visual accents.">
                        {(props) => (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="color"
                                    aria-label="Choose product color"
                                    value={data.brand_color}
                                    onChange={(e) => setData('brand_color', e.target.value.toUpperCase())}
                                    className="h-9 w-12 cursor-pointer p-1"
                                />
                                <Input
                                    {...props}
                                    value={data.brand_color}
                                    onChange={(e) => setData('brand_color', e.target.value.toUpperCase())}
                                    placeholder="#3B82F6"
                                    className="num uppercase"
                                />
                            </div>
                        )}
                    </Field>

                    <Field label="Description" error={errors.description} className="sm:col-span-4">
                        {(props) => (
                            <Textarea
                                {...props}
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                            />
                        )}
                    </Field>

                    <div className="sm:col-span-4">
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
                            <SearchableSelect
                                id={props.id}
                                invalid={props['aria-invalid']}
                                describedBy={props['aria-describedby']}
                                options={ownerOptions}
                                value={data.technical_owner_id}
                                onChange={(value) => setData('technical_owner_id', value)}
                                placeholder="Unassigned"
                                searchPlaceholder="Search owners..."
                            />
                        )}
                    </Field>

                    <Field label="Support team" error={errors.support_role_id}>
                        {(props) => (
                            <SearchableSelect
                                id={props.id}
                                invalid={props['aria-invalid']}
                                describedBy={props['aria-describedby']}
                                options={supportRoleOptions}
                                value={data.support_role_id}
                                onChange={(value) => setData('support_role_id', value)}
                                placeholder="Unassigned"
                                searchPlaceholder="Search roles..."
                            />
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
