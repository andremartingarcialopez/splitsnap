import { FormEvent, useEffect, useState } from 'react';
import type { Ticket, TicketParticipantLink } from '../types/domain';

const TIP_PRESETS = [0, 10, 15, 20];

type TipConfigProps = {
  ticket: Ticket;
  saving?: boolean;
  onUpdateGlobal: (input: {
    tipMode: 'GLOBAL' | 'INDIVIDUAL';
    globalTipPercentage: number;
  }) => Promise<void>;
  onUpdateParticipant: (
    participantId: string,
    individualTipPercentage: number,
  ) => Promise<void>;
};

export function TipConfig({
  ticket,
  saving = false,
  onUpdateGlobal,
  onUpdateParticipant,
}: TipConfigProps) {
  const [tipMode, setTipMode] = useState<'GLOBAL' | 'INDIVIDUAL'>(
    ticket.tipMode === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GLOBAL',
  );
  const [globalTip, setGlobalTip] = useState(
    String(ticket.globalTipPercentage ?? 10),
  );

  useEffect(() => {
    setTipMode(ticket.tipMode === 'INDIVIDUAL' ? 'INDIVIDUAL' : 'GLOBAL');
    setGlobalTip(String(ticket.globalTipPercentage ?? 10));
  }, [ticket.tipMode, ticket.globalTipPercentage]);

  async function handleGlobalSubmit(e: FormEvent) {
    e.preventDefault();
    const pct = Number(globalTip);
    if (Number.isNaN(pct) || pct < 0 || pct > 100) return;
    await onUpdateGlobal({ tipMode, globalTipPercentage: pct });
  }

  const currentTip = Number(globalTip) || 0;

  return (
    <section className="card space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground dark:text-white">Propina</h2>
        <p className="text-sm text-foreground-muted dark:text-slate-400">
          Configura el porcentaje global o individual por comensal.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleGlobalSubmit}>
        <div className="segmented">
          <button
            type="button"
            className={tipMode === 'GLOBAL' ? 'segmented-btn-active' : 'segmented-btn-inactive'}
            onClick={() => setTipMode('GLOBAL')}
          >
            Global
          </button>
          <button
            type="button"
            className={tipMode === 'INDIVIDUAL' ? 'segmented-btn-active' : 'segmented-btn-inactive'}
            onClick={() => setTipMode('INDIVIDUAL')}
          >
            Individual
          </button>
        </div>

        <div>
          <label className="label">Porcentaje de propina</label>
          <div className="flex flex-wrap gap-2">
            {TIP_PRESETS.map((pct) => (
              <button
                key={pct}
                type="button"
                className={currentTip === pct ? 'tip-pill-active' : 'tip-pill-inactive'}
                onClick={() => setGlobalTip(String(pct))}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="label" htmlFor="global-tip">
              Personalizado (%)
            </label>
            <input
              id="global-tip"
              className="input sm:max-w-[140px]"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={globalTip}
              onChange={(e) => setGlobalTip(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            Guardar propina
          </button>
        </div>
      </form>

      {tipMode === 'INDIVIDUAL' && (ticket.participants ?? []).length > 0 && (
        <ul className="divide-y divide-border border-t border-border pt-4 dark:divide-slate-800 dark:border-slate-800">
          {(ticket.participants ?? []).map((tp) => (
            <ParticipantTipRow
              key={tp.id}
              link={tp}
              saving={saving}
              onSave={onUpdateParticipant}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function ParticipantTipRow({
  link,
  saving,
  onSave,
}: {
  link: TicketParticipantLink;
  saving: boolean;
  onSave: (participantId: string, pct: number) => Promise<void>;
}) {
  const [value, setValue] = useState(
    String(link.individualTipPercentage ?? 10),
  );

  useEffect(() => {
    setValue(String(link.individualTipPercentage ?? 10));
  }, [link.individualTipPercentage]);

  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      <span className="text-sm font-medium text-foreground dark:text-white">
        {link.participant.name || 'Sin nombre'}
      </span>
      <div className="flex items-center gap-2">
        <input
          className="input w-24"
          type="number"
          min={0}
          max={100}
          step={0.5}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <span className="text-sm text-foreground-muted">%</span>
        <button
          type="button"
          className="btn-secondary btn-sm"
          disabled={saving}
          onClick={() => {
            const pct = Number(value);
            if (!Number.isNaN(pct)) void onSave(link.participantId, pct);
          }}
        >
          Aplicar
        </button>
      </div>
    </li>
  );
}
