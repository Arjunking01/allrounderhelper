import { type ButtonHTMLAttributes, type ReactNode, forwardRef } from 'react';
import { clsx } from '@/lib/utils/clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'text-white gradient-brand hover:brightness-110 active:brightness-95 shadow-lg shadow-electric-500/20',
  secondary:
    'bg-navy-900 text-white dark:bg-white dark:text-navy-900 hover:opacity-90',
  outline:
    'border border-navy-200 dark:border-white/15 text-navy-900 dark:text-ink-100 hover:bg-navy-50 dark:hover:bg-white/5',
  ghost: 'text-navy-700 dark:text-ink-300 hover:bg-navy-100/60 dark:hover:bg-white/5',
  danger: 'text-white bg-red-500 hover:bg-red-600 active:bg-red-700 shadow-lg shadow-red-500/20',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg gap-1.5',
  md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
  lg: 'text-base px-6 py-3.5 rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', icon, fullWidth, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {icon}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
