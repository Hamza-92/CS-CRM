import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { RoleForm } from '@/components/roles/role-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { ManagedRole, PermissionDefinition } from '@/types';

export default function RoleEdit({ role, permissions }: { role: ManagedRole; permissions: PermissionDefinition[] }) {
    return (
        <AppLayout>
            <Head title={`Edit ${role.label}`} />
            <PageHeader
                title={`Edit ${role.label}`}
                actions={<Button variant="secondary" onClick={() => router.visit('/roles')}><ArrowLeft /> Back to Roles</Button>}
            />
            <div className="w-full">
                <RoleForm role={role} permissions={permissions} action={`/roles/${role.id}`} method="put" submitLabel="Save changes" />
            </div>
        </AppLayout>
    );
}
