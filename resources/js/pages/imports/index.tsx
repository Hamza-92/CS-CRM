import { Head, router } from '@inertiajs/react';
import { CheckSquare, ContactRound, Download, FileUp, Target } from 'lucide-react';
import { useRef, useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';

interface Props { can: { customers: boolean; leads: boolean; tasks: boolean } }

function ImportCard({ title, endpoint, icon: Icon, can }: { title: string; endpoint: string; icon: typeof ContactRound; can: boolean }) {
    const input = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [busy, setBusy] = useState(false);
    const submit = () => {
        if (!file || busy) return;
        setBusy(true);
        const data = new FormData();
        data.append('file', file);
        router.post(endpoint, data, { forceFormData: true, onFinish: () => setBusy(false), onSuccess: () => setFile(null) });
    };
    if (!can) return null;
    return <Card><CardHeader title={title} /><CardBody className="space-y-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-brand-wash text-brand"><Icon className="size-4" /></span><div className="min-w-0"><p className="text-xs font-medium text-ink">Choose a CSV file</p><p className="truncate text-2xs text-ink-3">Required columns are validated before any records are created.</p></div></div><input ref={input} type="file" accept=".csv,text/csv" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><div className="flex items-center gap-2"><button type="button" onClick={() => input.current?.click()} className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}><FileUp className="size-3.5" /> {file ? file.name : 'Choose file'}</button>{file && <button type="button" onClick={submit} disabled={busy} className={cn(buttonVariants({ variant: 'primary', size: 'sm' }))}>{busy ? 'Importing…' : 'Import records'}</button>}</div></CardBody></Card>;
}

export default function ImportsIndex({ can }: Props) {
    return <AppLayout><Head title="Import data" /><PageHeader title="Import data" description="Bring operational records into the CRM from CSV files." actions={<a href="/reports" className={buttonVariants({ variant: 'secondary', size: 'sm' })}><Download className="size-3.5" /> Reports</a>} /><div className="grid gap-4 lg:grid-cols-3"><ImportCard title="Customers" endpoint="/imports/customers" icon={ContactRound} can={can.customers} /><ImportCard title="Leads" endpoint="/imports/leads" icon={Target} can={can.leads} /><ImportCard title="Tasks" endpoint="/imports/tasks" icon={CheckSquare} can={can.tasks} /></div></AppLayout>;
}
