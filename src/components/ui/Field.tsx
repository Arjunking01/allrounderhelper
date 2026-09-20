import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { clsx } from '@/lib/utils/clsx';

interface FieldWrapperProps {
  label: string;
  htmlFor: string;
  hint?: string;
  suffix?: string;
  children: ReactNode;
}

export function FieldWrapper({ label, htmlFor, hint, children }: FieldWrapperProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium text-navy-700 dark:text-ink-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-navy-500 dark:text-ink-500">{hint}</p>}
    </div>
  );
}

interface NumberFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  suffix?: string;
}

export function NumberField({ label, hint, suffix, id, className, ...props }: NumberFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id!} hint={hint}>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className={clsx(
            'w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 text-navy-900 dark:text-ink-100 placeholder:text-navy-400 dark:placeholder:text-ink-500 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 outline-none transition-colors',
            suffix && 'pr-12',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-navy-400 dark:text-ink-500">
            {suffix}
          </span>
        )}
      </div>
    </FieldWrapper>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function TextField({ label, hint, id, className, ...props }: TextFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id!} hint={hint}>
      <input
        id={id}
        className={clsx(
          'w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 text-navy-900 dark:text-ink-100 placeholder:text-navy-400 dark:placeholder:text-ink-500 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 outline-none transition-colors',
          className
        )}
        {...props}
      />
    </FieldWrapper>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hint?: string;
}

export function SelectField({ label, hint, id, className, children, ...props }: SelectFieldProps) {
  return (
    <FieldWrapper label={label} htmlFor={id!} hint={hint}>
      <select
        id={id}
        className={clsx(
          'w-full rounded-xl border border-navy-200 dark:border-white/10 bg-white dark:bg-navy-900/60 px-4 py-2.5 text-navy-900 dark:text-ink-100 focus:border-electric-500 focus:ring-2 focus:ring-electric-500/20 outline-none transition-colors',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}
