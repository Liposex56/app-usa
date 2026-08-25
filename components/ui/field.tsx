import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

import { cn } from '@/lib/utils';

const CONTROL =
  'w-full rounded-xl border border-espresso-700/15 bg-white px-4 py-2.5 text-[15px] ' +
  'text-espresso-700 placeholder:text-espresso-700/35 transition-colors ' +
  'hover:border-espresso-700/25 focus:border-gold-500 focus:outline-none ' +
  'focus:ring-2 focus:ring-gold-500/25 disabled:bg-espresso-700/5';

export function Field({
  label,
  hint,
  htmlFor,
  required,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-espresso-700"
      >
        {label}
        {required && <span className="ml-1 text-gold-600">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs leading-relaxed text-espresso-500/70">{hint}</p>}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(CONTROL, 'min-h-[110px]', className)} {...props} />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, 'appearance-none pr-10', className)} {...props}>
      {children}
    </select>
  );
}

/** Checkbox with a large tap target and description text. */
export function CheckboxCard({
  name,
  value,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  value?: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
}) {
  const id = `${name}-${value ?? 'on'}`;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-espresso-700/12 bg-white p-3.5 transition-colors hover:border-gold-500/50 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
    >
      <input
        id={id}
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        className="mt-0.5 shrink-0 accent-gold-500"
        style={{ width: '1.05rem', height: '1.05rem' }}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-espresso-700">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-espresso-500/75">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

/** Radio rendered as a selectable card. */
export function RadioCard({
  name,
  value,
  label,
  description,
  defaultChecked,
  required,
}: {
  name: string;
  value: string;
  label: string;
  description?: string;
  defaultChecked?: boolean;
  required?: boolean;
}) {
  const id = `${name}-${value}`;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-espresso-700/12 bg-white p-3.5 transition-colors hover:border-gold-500/50 has-[:checked]:border-gold-500 has-[:checked]:bg-gold-50"
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={value}
        required={required}
        defaultChecked={defaultChecked}
        className="mt-0.5 shrink-0 accent-gold-500"
        style={{ width: '1.05rem', height: '1.05rem' }}
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-espresso-700">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs leading-relaxed text-espresso-500/75">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-xl border border-red-300/60 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message}
    </p>
  );
}

export function FormNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-relaxed text-sky-800">
      {children}
    </p>
  );
}
