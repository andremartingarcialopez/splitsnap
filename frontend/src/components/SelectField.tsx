import { useEffect, useId, useRef, useState } from 'react';

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectFieldProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
};

/** Select personalizado alineado al design system (evita el picker nativo del SO). */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar…',
  disabled = false,
  className = '',
  id,
}: SelectFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const hasValue = Boolean(selected && selected.value !== '');

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  function pick(next: string) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 w-full max-w-full ${className}`}>
      <button
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="input box-border flex max-w-full w-full min-w-0 items-center justify-between gap-2 text-left"
        onClick={() => !disabled && setOpen((v) => !v)}
      >
        <span className={hasValue ? 'truncate text-foreground dark:text-slate-100' : 'truncate text-[#6B7280] dark:text-slate-500'}>
          {displayLabel}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-[#6B7280] transition-transform dark:text-slate-400 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Fondo en móvil — bottom sheet */}
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] md:hidden"
            aria-label="Cerrar opciones"
            onClick={() => setOpen(false)}
          />

          <ul
            role="listbox"
            aria-labelledby={fieldId}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[min(60vh,420px)] overflow-y-auto rounded-t-3xl border border-border bg-white p-2 shadow-card-lg dark:border-slate-700 dark:bg-slate-900 md:absolute md:inset-x-0 md:bottom-auto md:top-[calc(100%+0.25rem)] md:max-h-60 md:rounded-2xl md:p-1.5 md:shadow-card"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <li key={option.value || '__empty'}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={option.disabled}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-3 text-left text-sm transition md:py-2.5 ${
                      isSelected
                        ? 'bg-primary-muted font-medium text-primary dark:bg-primary/20 dark:text-primary-light'
                        : 'text-foreground hover:bg-[#F3F4F6] dark:text-slate-200 dark:hover:bg-slate-800'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                    onClick={() => !option.disabled && pick(option.value)}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className="h-4 w-4 shrink-0 text-primary dark:text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
