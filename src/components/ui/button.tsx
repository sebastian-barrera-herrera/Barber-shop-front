import Link from 'next/link';
import type { ComponentProps, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background-color,color,border-color,transform] duration-200 ease-soft active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-brand/88',
  secondary: 'border border-ink/80 text-ink hover:bg-ink hover:text-paper',
  ghost: 'text-ink underline-offset-4 hover:underline',
};

const sizes: Record<Size, string> = {
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-13 px-7 text-base',
};

export function buttonClass(variant: Variant = 'primary', size: Size = 'md', className = '') {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`;
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  className?: string;
}

export function Button({
  variant,
  size,
  className,
  ...props
}: CommonProps & ComponentProps<'button'>) {
  return <button type="button" className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant,
  size,
  className,
  ...props
}: CommonProps & ComponentProps<typeof Link>) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/** Flecha fina usada en enlaces y filas de la carta. */
export function Arrow({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" aria-hidden className={`size-4 ${className}`}>
      <path
        d="M4 10h11m-4-4 4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
