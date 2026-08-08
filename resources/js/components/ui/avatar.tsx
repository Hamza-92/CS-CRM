import { cn } from '@/lib/utils';

const palettes = [
    'bg-brand-wash text-brand',
    'bg-ok-wash text-ok',
    'bg-info-wash text-info',
    'bg-alt-wash text-alt',
    'bg-warn-wash text-warn',
    'bg-bad-wash text-bad',
];

function hash(value: string) {
    let total = 0;
    for (let i = 0; i < value.length; i += 1) {
        total = (total + value.charCodeAt(i) * (i + 1)) % 997;
    }

    return total;
}

export function initialsOf(name: string) {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase();
}

export function Avatar({
    name,
    src,
    size = 'md',
    className,
}: {
    name: string;
    src?: string | null;
    size?: 'xs' | 'sm' | 'md' | 'lg';
    className?: string;
}) {
    const sizes = {
        xs: 'size-4.5 text-[8px]',
        sm: 'size-6 text-[9px]',
        md: 'size-7 text-2xs',
        lg: 'size-9 text-xs',
    };

    return (
        <span
            aria-hidden="true"
            className={cn(
                'inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
                palettes[hash(name) % palettes.length],
                sizes[size],
                className,
            )}
        >
            {src ? <img src={src} alt="" className="size-full rounded-[inherit] object-cover" /> : initialsOf(name)}
        </span>
    );
}
