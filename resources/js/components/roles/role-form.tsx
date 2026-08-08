import { Link, useForm } from '@inertiajs/react';
import { Check, LoaderCircle } from 'lucide-react';
import { type FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';
import type { ManagedRole, PermissionDefinition } from '@/types';

interface RoleFormData {
    name: string;
    permissions: string[];
}

function PermissionCheckbox({
    checked,
    onChange,
    ariaLabel,
}: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    ariaLabel: string;
}) {
    return (
        <>
            <input
                type="checkbox"
                checked={checked}
                aria-label={ariaLabel}
                onChange={(event) => onChange(event.target.checked)}
                className="peer sr-only"
            />
            <span className="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-brand bg-surface transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/20 peer-checked:bg-brand peer-checked:text-brand-ink">
                {checked && <Check aria-hidden="true" className="size-3 stroke-[2.5]" />}
            </span>
        </>
    );
}

export function RoleForm({
    role,
    permissions,
    action,
    method,
    submitLabel,
}: {
    role?: ManagedRole;
    permissions: PermissionDefinition[];
    action: string;
    method: 'post' | 'put';
    submitLabel: string;
}) {
    const { data, setData, post, put, processing, errors } = useForm<RoleFormData>({
        name: role ? (role.is_system ? role.name : role.label) : '',
        permissions: role?.permission_names ?? [],
    });

    const groups = useMemo(() => permissions.reduce<Record<string, PermissionDefinition[]>>((result, permission) => {
        (result[permission.group] ??= []).push(permission);

        return result;
    }, {}), [permissions]);

    function togglePermission(value: string, checked: boolean) {
        setData('permissions', checked
            ? [...new Set([...data.permissions, value])]
            : data.permissions.filter((permission) => permission !== value));
    }

    function toggleGroup(group: PermissionDefinition[], checked: boolean) {
        const values = group.map((permission) => permission.value);
        setData('permissions', checked
            ? [...new Set([...data.permissions, ...values])]
            : data.permissions.filter((permission) => !values.includes(permission)));
    }

    const allSelected = permissions.length > 0 && data.permissions.length === permissions.length;

    function submit(event: FormEvent) {
        event.preventDefault();
        (method === 'post' ? post : put)(action);
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            <Card>
                <CardHeader title="Role" />
                <CardBody>
                    <Field label="Role name" error={errors.name} required>
                        {(props) => (
                            <Input
                                {...props}
                                value={role?.is_system ? role.label : data.name}
                                disabled={role?.is_system}
                                placeholder="eg. Sales manager"
                                onChange={(event) => setData('name', event.target.value)}
                            />
                        )}
                    </Field>
                </CardBody>
            </Card>

            <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface-2 px-4 py-3 shadow-card">
                            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-ink">
                                <PermissionCheckbox
                                    ariaLabel="Select all permissions"
                                    checked={allSelected}
                                    onChange={(checked) => toggleGroup(permissions, checked)}
                                />
                                Select All Permissions
                            </label>
                            <span className="shrink-0 text-xs text-ink-2">
                                <span className="num">{data.permissions.length}</span> of <span className="num">{permissions.length}</span> selected
                            </span>
                        </div>

                        <div className="space-y-4">
                        {Object.entries(groups).map(([group, groupPermissions]) => {
                            const values = groupPermissions.map((permission) => permission.value);
                            const selected = values.filter((value) => data.permissions.includes(value)).length;
                            const allSelected = selected === values.length;

                            return (
                                <div key={group} className="overflow-hidden rounded-md border border-line bg-surface shadow-card">
                                    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-line bg-surface-2 px-4 py-3 text-sm font-medium text-ink">
                                        <span className="flex items-center gap-3">
                                            <PermissionCheckbox
                                                ariaLabel={`Select all ${group} permissions`}
                                                checked={allSelected}
                                                onChange={(checked) => toggleGroup(groupPermissions, checked)}
                                            />
                                            <span>{group}</span>
                                        </span>
                                        <span className="shrink-0 text-xs font-normal text-ink-2">
                                            <span className="num">{selected}</span> of <span className="num">{values.length}</span> selected
                                        </span>
                                    </label>
                                    <div className="grid gap-x-8 gap-y-3 px-4 py-3 sm:grid-cols-2 lg:grid-cols-4">
                                        {groupPermissions.map((permission) => (
                                            <label key={permission.value} className="flex cursor-pointer items-center gap-3 text-sm text-ink">
                                                <PermissionCheckbox
                                                    ariaLabel={permission.label}
                                                    checked={data.permissions.includes(permission.value)}
                                                    onChange={(checked) => togglePermission(permission.value, checked)}
                                                />
                                                {permission.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Link href="/roles">
                            <Button variant="secondary">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing && <LoaderCircle className="animate-spin" />}
                            {submitLabel}
                        </Button>
                    </div>
        </form>
    );
}
