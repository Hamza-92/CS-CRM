import { Head, router } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { RoleForm } from '@/components/roles/role-form';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { PermissionDefinition } from '@/types';

export default function RoleCreate({ permissions }: { permissions: PermissionDefinition[] }) {
    return (
        <AppLayout>
            <Head title="New role" />
            <PageHeader
                title="New role"
                actions={<Button variant="secondary" onClick={() => router.visit('/roles')}><ArrowLeft /> Back to Roles</Button>}
            />
            <div className="w-full">
                <RoleForm permissions={permissions} action="/roles" method="post" submitLabel="Create role" />
            </div>
        </AppLayout>
    );
}
