import { cn } from '@/lib/utils';

export interface SegmentOption<T extends string> {
    value: T;
    label: string;
}

export function Segmented<T extends string>({
    options,
    value,
    onChange,
    ariaLabel,
}: {
    options: SegmentOption<T>[];
    value: T;
    onChange: (value: T) => void;
    ariaLabel: string;
}) {
    return (
        <div role="tablist" aria-label={ariaLabel} className="inline-flex rounded-md bg-surface-3 p-0.5">
            {options.map((option) => {
                const active = option.value === value;

                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            'rounded-[5px] px-2.5 py-1 text-2xs font-medium transition-all duration-150',
                            active ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink-2',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
