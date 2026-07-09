const TIP_PRESETS = [0, 10, 15, 20];

type GlobalTipSelectorProps = {
  value: number;
  onChange?: (pct: number) => void;
  /** Solo muestra la propina acordada; no permite editarla. */
  readOnly?: boolean;
};

export function GlobalTipSelector({ value, onChange, readOnly = false }: GlobalTipSelectorProps) {
  return (
    <div
      className={['space-y-3', readOnly ? 'pointer-events-none opacity-80' : ''].join(' ')}
      aria-readonly={readOnly || undefined}
    >
      <div className="flex flex-wrap gap-2">
        {TIP_PRESETS.map((pct) => (
          <button
            key={pct}
            type="button"
            disabled={readOnly}
            className={value === pct ? 'tip-pill-active' : 'tip-pill-inactive'}
            onClick={() => onChange?.(pct)}
            aria-pressed={value === pct}
          >
            {pct}%
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor={readOnly ? undefined : 'custom-tip'}>
          Personalizado (%)
        </label>
        <input
          id={readOnly ? undefined : 'custom-tip'}
          className="input sm:max-w-[140px]"
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => {
            if (readOnly) return;
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange?.(n);
          }}
        />
      </div>
    </div>
  );
}
