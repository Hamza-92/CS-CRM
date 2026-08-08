import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface SelectOption {
    value: string;
    label: string;
    hint?: string;
}

export function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select…',
    searchPlaceholder = 'Search...',
    id,
    invalid,
    describedBy,
    disabled,
    emptyLabel = 'No matches',
}: {
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    id?: string;
    invalid?: boolean;
    describedBy?: string;
    disabled?: boolean;
    emptyLabel?: string;
}) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(0);
    const [position, setPosition] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const selected = options.find((option) => option.value === value);

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();

        if (!term) {
            return options;
        }

        return options.filter(
            (option) =>
                option.label.toLowerCase().includes(term) || (option.hint ?? '').toLowerCase().includes(term),
        );
    }, [options, query]);

    useEffect(() => {
        if (!open) {
            return;
        }

        function updatePosition() {
            const rect = triggerRef.current?.getBoundingClientRect();
            if (!rect) return;

            const shouldDropUp = window.innerHeight - rect.bottom < 280;
            setPosition({
                left: rect.left,
                width: rect.width,
                ...(shouldDropUp ? { bottom: window.innerHeight - rect.top + 6 } : { top: rect.bottom + 6 }),
            });
        }

        updatePosition();

        const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 10);

        function onPointerDown(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [open]);

    useEffect(() => {
        setActive(0);
    }, [query, open]);

    useEffect(() => {
        listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    }, [active]);

    function choose(option: SelectOption) {
        onChange(option.value);
        setOpen(false);
        setQuery('');
        triggerRef.current?.focus();
    }

    function onKeyDown(event: React.KeyboardEvent) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            triggerRef.current?.focus();

            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActive((index) => Math.min(index + 1, filtered.length - 1));

            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActive((index) => Math.max(index - 1, 0));

            return;
        }

        if (event.key === 'Enter' && filtered[active]) {
            event.preventDefault();
            choose(filtered[active]);
        }
    }

    return (
        <div ref={rootRef} className="relative">
            <button
                ref={triggerRef}
                id={id}
                type="button"
                role="combobox"
                aria-expanded={open}
                aria-haspopup="listbox"
                aria-invalid={invalid}
                aria-describedby={describedBy}
                disabled={disabled}
                onClick={() => setOpen((state) => !state)}
                onKeyDown={(event) => {
                    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        setOpen(true);
                    }
                }}
                className={cn(
                    'flex h-9 w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-left text-xs shadow-card transition-colors',
                    'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3',
                    invalid ? 'border-bad' : 'border-line-2 hover:border-ink-3',
                    open && !invalid && 'border-brand ring-2 ring-brand/15',
                )}
            >
                <span className={cn('truncate', selected ? 'text-ink' : 'text-ink-3')}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown className={cn('size-3.5 shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} />
            </button>

            {open && position && createPortal(
                <div
                    ref={menuRef}
                    className="fixed z-[100] overflow-hidden rounded-lg border border-line bg-surface shadow-pop"
                    style={{ left: position.left, width: position.width, top: position.top, bottom: position.bottom }}
                >
                    <div className="border-b border-line p-2">
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-3" />
                            <input
                                ref={searchRef}
                                type="text"
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                onKeyDown={onKeyDown}
                                placeholder={searchPlaceholder}
                                aria-label={searchPlaceholder}
                                className="h-8 w-full rounded-md border border-line bg-surface-2 pr-2.5 pl-8 text-xs text-ink placeholder:text-ink-3 focus:border-brand focus:outline-none"
                            />
                        </div>
                    </div>

                    <ul ref={listRef} role="listbox" className="max-h-56 overflow-y-auto py-1">
                        {filtered.length === 0 && <li className="px-3 py-2 text-xs text-ink-3">{emptyLabel}</li>}

                        {filtered.map((option, index) => {
                            const isSelected = option.value === value;

                            return (
                                <li key={option.value}>
                                    <button
                                        type="button"
                                        role="option"
                                        data-index={index}
                                        aria-selected={isSelected}
                                        onMouseEnter={() => setActive(index)}
                                        onClick={() => choose(option)}
                                        className={cn(
                                            'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs transition-colors',
                                            index === active ? 'bg-surface-3 text-ink' : 'text-ink-2',
                                        )}
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate">{option.label}</span>
                                            {option.hint && (
                                                <span className="block truncate text-2xs text-ink-3">{option.hint}</span>
                                            )}
                                        </span>
                                        {isSelected && <Check className="size-3.5 shrink-0 text-brand" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>,
                document.body,
            )}
        </div>
    );
}
