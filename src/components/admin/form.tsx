import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

/** Campos del panel: etiqueta visible siempre, mismo alto y borde en todos. */
const control =
  'h-11 w-full rounded-xl border border-line bg-paper px-3.5 text-base hover:border-stone focus:border-ink focus:outline-none disabled:opacity-60';

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm">
        {label}
      </label>
      {children}
      {hint && <p className="text-stone mt-1.5 text-sm">{hint}</p>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${control} ${props.className ?? ''}`} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${control} appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat pr-9 ${props.className ?? ''}`}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236f695f' stroke-width='1.5' fill='none'/%3E%3C/svg%3E\")",
      }}
    >
      {children}
    </select>
  );
}
