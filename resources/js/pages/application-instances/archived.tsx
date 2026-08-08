import { Head, Link, router } from '@inertiajs/react';
import { ArchiveRestore, ArrowLeft, Eye } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/pagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { ApplicationInstance, Paginated } from '@/types';

export default function ArchivedInstances({ instances }: { instances: Paginated<ApplicationInstance> }) {
    return <AppLayout><Head title="Archived instances" /><PageHeader title="Archived instances" actions={<Link href="/instances"><Button variant="secondary"><ArrowLeft /> Back to Instances</Button></Link>} /><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b border-line bg-surface-2 text-xs uppercase tracking-wider text-ink-3"><tr><th className="px-4 py-3">Instance</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Product</th><th className="px-4 py-3">Archived</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-line">{instances.data.map((instance) => <tr key={instance.id}><td className="px-4 py-3 font-semibold text-ink">{instance.name}<div className="text-xs font-normal text-ink-3">{instance.environment_label ?? instance.environment}</div></td><td className="px-4 py-3 text-ink-2">{instance.customer?.business || instance.customer?.name}</td><td className="px-4 py-3 text-ink-2">{instance.product?.name}</td><td className="px-4 py-3"><Badge tone="neutral" size="sm">Archived</Badge></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Link href={`/instances/${instance.id}`}><Button variant="ghost" size="icon" aria-label="View instance"><Eye /></Button></Link><Button variant="ghost" size="icon" aria-label="Restore instance" onClick={() => router.patch(`/instances/${instance.id}/restore`)}><ArchiveRestore /></Button></div></td></tr>)}</tbody></table></div><Pagination meta={instances} perPage={Number(instances.per_page)} /></Card></AppLayout>;
}
