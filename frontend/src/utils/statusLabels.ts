/** Etiquetas en español para estados del backend. */

const TICKET_SESSION: Record<string, string> = {
  CREATED: 'Creado',
  WAITING_FOR_PARTICIPANTS: 'Esperando participantes',
  IN_PROGRESS: 'En progreso',
  REVIEWING: 'Revisando',
  FINISHED: 'Finalizado',
  REOPENED: 'Reabierto',
  CANCELLED: 'Cancelado',
};

const PARTICIPANT_SESSION: Record<string, string> = {
  NOT_JOINED: 'Pendiente',
  CONNECTED: 'Conectado',
  SELECTING: 'Seleccionando',
  COMPLETED: 'Terminó',
  DISCONNECTED: 'Desconectado',
  LEFT: 'Abandonó',
  ABANDONED: 'Abandonó',
};

export type ParticipantSessionTone = 'neutral' | 'selecting' | 'done' | 'danger';

export function formatTicketSessionStatus(status?: string | null): string {
  if (!status) return 'Activo';
  return TICKET_SESSION[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

export function getParticipantSessionDisplay(status?: string | null): {
  label: string;
  tone: ParticipantSessionTone;
} {
  switch (status) {
    case 'COMPLETED':
      return { label: PARTICIPANT_SESSION.COMPLETED, tone: 'done' };
    case 'SELECTING':
      return { label: PARTICIPANT_SESSION.SELECTING, tone: 'selecting' };
    case 'ABANDONED':
    case 'LEFT':
    case 'DISCONNECTED':
      return {
        label: PARTICIPANT_SESSION[status] ?? 'Abandonó',
        tone: 'danger',
      };
    case 'CONNECTED':
      return { label: PARTICIPANT_SESSION.CONNECTED, tone: 'neutral' };
    default:
      return {
        label: PARTICIPANT_SESSION[status ?? ''] ?? PARTICIPANT_SESSION.NOT_JOINED,
        tone: 'neutral',
      };
  }
}
