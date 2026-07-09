const TIP_PRESETS = [0, 10, 15, 20];

type GlobalTipSelectorProps = {
  value: number;
  onChange: (pct: number) => void;
};

export function GlobalTipSelector({ value, onChange }: GlobalTipSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TIP_PRESETS.map((pct) => (
          <button
            key={pct}
            type="button"
            className={value === pct ? 'tip-pill-active' : 'tip-pill-inactive'}
            onClick={() => onChange(pct)}
          >
            {pct}%
          </button>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="custom-tip">
          Personalizado (%)
        </label>
        <input
          id="custom-tip"
          className="input sm:max-w-[140px]"
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(n);
          }}
        />
      </div>
    </div>
  );
}
