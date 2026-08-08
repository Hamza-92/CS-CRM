import { Link, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@/components/ui/card';
import { Field, Input, Select, Toggle } from '@/components/ui/field';
import type { BillingCycleOption, Plan } from '@/types';

interface PlanFormValues {
    name: string;
    code: string;
    billing_cycle: string;
    duration_days: string;
    price: string;
    currency: string;
    grace_days: string;
    is_active: boolean;
    sort_order: string;
}

export function PlanForm({
    plan,
    productId,
    billingCycles,
    currencies,
    defaults,
    action,
    method,
    submitLabel,
}: {
    plan?: Plan;
    productId: number;
    billingCycles: BillingCycleOption[];
    currencies: string[];
    defaults?: { currency: string; grace_days: number };
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
}) {
    const { data, setData, post, put, processing, errors } = useForm<PlanFormValues>({
        name: plan?.name ?? '',
        code: plan?.code ?? '',
        billing_cycle: plan?.billing_cycle ?? 'monthly',
        duration_days: plan?.duration_days != null ? String(plan.duration_days) : '',
        price: plan?.price ?? '0',
        currency: plan?.currency ?? defaults?.currency ?? currencies[0],
        grace_days: plan ? String(plan.grace_days) : String(defaults?.grace_days ?? 0),
        is_active: plan?.is_active ?? true,
        sort_order: plan ? String(plan.sort_order) : '0',
    });

    const isLifetime = data.billing_cycle === 'lifetime';

    function onCycleChange(value: string) {
        const cycle = billingCycles.find((option) => option.value === value);

        setData((current) => ({
            ...current,
            billing_cycle: value,
            duration_days: value === 'lifetime' ? '' : String(cycle?.default_duration_days ?? current.duration_days),
            name: current.name === '' ? (cycle?.label ?? '') : current.name,
        }));
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        (method === 'post' ? post : put)(action);
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <Card>
                <CardHeader title="Terms" />
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
                                placeholder="ANN"
                                className="num uppercase"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Sort order" error={errors.sort_order}>
                        {(props) => (
                            <Input
                                {...props}
                                type="number"
                                min={0}
                                className="num"
                                value={data.sort_order}
                                onChange={(e) => setData('sort_order', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Billing cycle" error={errors.billing_cycle} required className="sm:col-span-2">
                        {(props) => (
                            <Select {...props} value={data.billing_cycle} onChange={(e) => onCycleChange(e.target.value)}>
                                {billingCycles.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>

                    <Field
                        label="Duration (days)"
                        error={errors.duration_days}
                        hint={isLifetime ? 'Lifetime never expires' : undefined}
                        className="sm:col-span-2"
                    >
                        {(props) => (
                            <Input
                                {...props}
                                type="number"
                                min={1}
                                max={3650}
                                className="num"
                                disabled={isLifetime}
                                value={data.duration_days}
                                onChange={(e) => setData('duration_days', e.target.value)}
                            />
                        )}
                    </Field>
                </CardBody>
            </Card>

            <Card>
                <CardHeader title="Pricing" />
                <CardBody className="grid gap-4 sm:grid-cols-3">
                    <Field label="Price" error={errors.price} required>
                        {(props) => (
                            <Input
                                {...props}
                                type="number"
                                min={0}
                                step="0.01"
                                className="num"
                                value={data.price}
                                onChange={(e) => setData('price', e.target.value)}
                            />
                        )}
                    </Field>

                    <Field label="Currency" error={errors.currency} required>
                        {(props) => (
                            <Select {...props} value={data.currency} onChange={(e) => setData('currency', e.target.value)}>
                                {currencies.map((currency) => (
                                    <option key={currency} value={currency}>
                                        {currency}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </Field>

                    <Field label="Grace period (days)" error={errors.grace_days} required>
                        {(props) => (
                            <Input
                                {...props}
                                type="number"
                                min={0}
                                max={365}
                                className="num"
                                value={data.grace_days}
                                onChange={(e) => setData('grace_days', e.target.value)}
                            />
                        )}
                    </Field>

                    <div className="sm:col-span-3">
                        <Toggle
                            label="Active"
                            hint="Inactive plans cannot be chosen for new subscriptions."
                            error={errors.is_active}
                            checked={data.is_active}
                            onChange={(checked) => setData('is_active', checked)}
                        />
                    </div>
                </CardBody>
                <CardFooter>
                    <Link href={`/products/${productId}`}>
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
