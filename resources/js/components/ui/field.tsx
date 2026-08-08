import {
    forwardRef,
    type InputHTMLAttributes,
    type LabelHTMLAttributes,
    type ReactNode,
    type SelectHTMLAttributes,
    type TextareaHTMLAttributes,
    useId,
} from 'react';
import { cn } from '@/lib/utils';

const control =
    'w-full rounded-md border border-line-2 bg-surface px-3 text-xs text-ink shadow-card transition-colors placeholder:text-ink-3 hover:border-ink-3 focus:border-brand focus:ring-2 focus:ring-brand/15 focus:outline-none disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-ink-3 aria-invalid:border-bad aria-invalid:focus:ring-bad/15';

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(function Label(
    { className, ...props },
    ref,
) {
    return <label ref={ref} className={cn('text-xs font-medium text-ink', className)} {...props} />;
});

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
    { className, ...props },
    ref,
) {
    return <input ref={ref} className={cn(control, 'h-9', className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
    { className, rows = 3, ...props },
    ref,
) {
    return <textarea ref={ref} rows={rows} className={cn(control, 'resize-y py-2 leading-relaxed', className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
    { className, ...props },
    ref,
) {
    return <select ref={ref} className={cn(control, 'h-9 cursor-pointer pr-8', className)} {...props} />;
});

export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Checkbox(
    { className, ...props },
    ref,
) {
    return (
        <input
            ref={ref}
            type="checkbox"
            className={cn(
                'size-4 shrink-0 cursor-pointer rounded-[4px] border-line-2 text-brand accent-[var(--brand)]',
                className,
            )}
            {...props}
        />
    );
});

interface FieldProps {
    label: string;
    error?: string;
    hint?: string;
    required?: boolean;
    action?: ReactNode;
    className?: string;
    children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby': string | undefined }) => ReactNode;
}

export function Field({ label, error, hint, required, action, className, children }: FieldProps) {
    const id = useId();
    const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div className={cn('space-y-1.5', className)}>
            <div className="flex items-baseline justify-between gap-3">
                <Label htmlFor={id}>
                    {label}
                    {required && <span className="ml-0.5 text-bad">*</span>}
                </Label>
                {action}
            </div>
            {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
            {hint && !error && (
                <p id={`${id}-hint`} className="text-2xs text-ink-3">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} className="text-2xs font-medium text-bad">
                    {error}
                </p>
            )}
        </div>
    );
}

export function Toggle({
    label,
    hint,
    error,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    hint?: string;
    error?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    const id = useId();

    return (
        <div>
            <div className="flex items-center justify-between gap-4 rounded-md border border-line bg-surface-2 px-3 py-2">
                <div className="min-w-0">
                    <Label htmlFor={id} className="cursor-pointer">
                        {label}
                    </Label>
                    {hint && <p className="mt-0.5 text-2xs text-ink-3">{hint}</p>}
                </div>
                <button
                    id={id}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    disabled={disabled}
                    onClick={() => onChange(!checked)}
                    className={cn(
                        'relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-45',
                        checked ? 'bg-brand' : 'bg-line-2',
                    )}
                >
                    <span
                        className={cn(
                            'absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-150',
                            checked ? 'translate-x-4' : 'translate-x-0',
                        )}
                    />
                </button>
            </div>
            {error && <p className="mt-1 text-2xs font-medium text-bad">{error}</p>}
        </div>
    );
}

export function CheckboxField({
    label,
    hint,
    error,
    checked,
    onChange,
    disabled,
}: {
    label: string;
    hint?: string;
    error?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    const id = useId();

    return (
        <div>
            <div className="flex items-start gap-2">
                <Checkbox
                    id={id}
                    checked={checked}
                    disabled={disabled}
                    onChange={(event) => onChange(event.target.checked)}
                    className="mt-0.5"
                />
                <div className="min-w-0">
                    <Label htmlFor={id} className="cursor-pointer">
                        {label}
                    </Label>
                    {hint && <p className="text-2xs text-ink-3">{hint}</p>}
                </div>
            </div>
            {error && <p className="mt-1 text-2xs font-medium text-bad">{error}</p>}
        </div>
    );
}
