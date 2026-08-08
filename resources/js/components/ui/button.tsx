import { cva, type VariantProps } from 'class-variance-authority';
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const button = cva(
    'inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                primary: 'bg-brand text-brand-ink shadow-card hover:bg-brand-2 active:scale-[0.985]',
                secondary: 'border border-line-2 bg-surface text-ink shadow-card hover:border-ink-3 hover:bg-surface-2',
                subtle: 'bg-surface-3 text-ink-2 hover:bg-line hover:text-ink',
                ghost: 'text-ink-3 hover:bg-surface-3 hover:text-ink',
                danger: 'bg-bad text-brand-ink shadow-card hover:brightness-110 active:scale-[0.985]',
                link: 'text-brand underline-offset-4 hover:underline',
            },
            size: {
                xs: 'h-7 gap-1 px-2 text-2xs [&_svg]:size-3',
                sm: 'h-8 px-2.5 text-2xs [&_svg]:size-3.5',
                md: 'h-9 px-3 text-xs [&_svg]:size-4',
                lg: 'h-10 px-4 text-xs [&_svg]:size-4',
                icon: 'size-8 [&_svg]:size-4',
                'icon-sm': 'size-8 [&_svg]:size-4',
            },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
    },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { className, variant, size, type = 'button', ...props },
    ref,
) {
    return <button ref={ref} type={type} className={cn(button({ variant, size }), className)} {...props} />;
});

export { button as buttonVariants };
