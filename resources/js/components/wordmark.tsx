import { cn } from '@/lib/utils';

const sizes = {
    sm: 'text-2xs tracking-[0.12em]',
    md: 'text-xs tracking-[0.13em]',
    lg: 'text-xl tracking-[0.14em]',
};

export function Wordmark({
    name,
    size = 'md',
    className,
}: {
    name: string;
    size?: keyof typeof sizes;
    className?: string;
}) {
    const text = name.toUpperCase();

    return (
        <span className={cn('leading-none font-bold whitespace-nowrap select-none', sizes[size], className)}>
            <span className="text-brand">{text.charAt(0)}</span>
            <span className="text-ink">{text.slice(1)}</span>
        </span>
    );
}

export function WordmarkBadge({ name, className }: { name: string; className?: string }) {
    return (
        <span
            className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-xs font-bold text-brand-ink select-none',
                className,
            )}
        >
            {name.charAt(0).toUpperCase()}
        </span>
    );
}
