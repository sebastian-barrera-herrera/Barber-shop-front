'use client';

/** Interruptor accesible (role="switch"). Para "activo / pausado" y opciones sí/no. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
  showLabel = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3 disabled:opacity-50"
    >
      <span
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${checked ? 'bg-ink' : 'bg-line'}`}
      >
        <span
          className={`bg-paper absolute top-0.5 size-5 rounded-full shadow transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </span>
      {showLabel && <span className="text-left">{label}</span>}
    </button>
  );
}
