import { useMemo, useState } from 'react';
import type { ShareInfo } from '../types/domain';
import { showSuccessToast } from '../utils/toast';

type ShareTicketPanelProps = {
  share: ShareInfo;
};

function buildPublicUrl(publicPath: string): string {
  if (typeof window === 'undefined') return publicPath;
  return `${window.location.origin}${publicPath}`;
}

export function ShareTicketPanel({ share }: ShareTicketPanelProps) {
  const [copied, setCopied] = useState(false);
  const publicUrl = useMemo(() => buildPublicUrl(share.publicPath), [share.publicPath]);
  const qrUrl = useMemo(
    () =>
      `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(publicUrl)}`,
    [publicUrl],
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      showSuccessToast('Enlace copiado');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showSuccessToast('No se pudo copiar el enlace');
    }
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `¡Únete a dividir la cuenta en SplitSnap!\n${publicUrl}`,
    );
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  }

  function shareNative() {
    if (navigator.share) {
      void navigator.share({
        title: 'SplitSnap',
        text: 'Únete a dividir la cuenta',
        url: publicUrl,
      });
      return;
    }
    void copyLink();
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4 text-center">
        <p className="text-sm text-foreground-muted dark:text-slate-400">Código de acceso</p>
        <p className="font-mono text-3xl font-bold tracking-widest text-foreground dark:text-white">
          {share.shareCode}
        </p>
        <p className="break-all text-sm text-foreground-muted dark:text-slate-400">{publicUrl}</p>
        <img
          src={qrUrl}
          alt={`Código QR para ${share.shareCode}`}
          className="mx-auto rounded-2xl border border-border bg-white p-3 dark:border-slate-800"
          width={220}
          height={220}
        />
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" className="btn-primary w-full" onClick={shareNative}>
          Compartir con mis amigos
        </button>
        <button type="button" className="btn-secondary w-full" onClick={shareWhatsApp}>
          WhatsApp
        </button>
        <button type="button" className="btn-secondary w-full" onClick={() => void copyLink()}>
          {copied ? '¡Copiado!' : 'Copiar enlace'}
        </button>
      </div>
    </div>
  );
}
