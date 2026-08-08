import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Wordmark } from '@/components/wordmark';
import type { SharedProps } from '@/types';

export default function AuthLayout({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: ReactNode;
}) {
    const { app } = usePage<SharedProps>().props;

    return (
        <div className="dot-field flex min-h-screen items-center justify-center px-4 py-12">
            <div className="w-full max-w-[420px]">
                <div className="mb-8 text-center">
                    <Wordmark name={app.name} size="lg" />
                </div>

                <div className="relative">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-2.5 -left-2.5 size-9 rounded-tl-xl border-t-2 border-l-2 border-brand"
                    />
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-2.5 -bottom-2.5 size-9 rounded-br-xl border-r-2 border-b-2 border-brand"
                    />

                    <div className="relative rounded-xl border border-line bg-surface px-7 py-8 shadow-pop">
                        <h1 className="text-center text-xl font-bold tracking-tight text-ink">{title}</h1>
                        <span aria-hidden="true" className="mx-auto mt-2.5 block h-0.5 w-12 rounded-full bg-brand" />
                        {description && <p className="mt-3 text-center text-xs text-ink-2">{description}</p>}

                        <div className="mt-6">{children}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
