import type { Ticket } from '../types/domain';

/** Sesiones en las que aún no hay división colaborativa (ni shareCode útil). */
const PRE_DIVISION_SESSIONS = new Set(['DRAFT', 'CREATED']);

/**
 * Ticket que se puede abandonar/descartar sin afectar una sesión compartida.
 * Incluye fallidos del pipeline mientras no se haya iniciado la división.
 */
export function isAbandonableTicket(
  ticket: Pick<
    Ticket,
    'shareCode' | 'finalizedAt' | 'sessionStatus' | 'processingStatus'
  > | null | undefined,
): boolean {
  if (!ticket) return false;
  if (ticket.finalizedAt) return false;
  if (ticket.shareCode) return false;

  const session = ticket.sessionStatus ?? 'DRAFT';
  if (PRE_DIVISION_SESSIONS.has(session)) return true;
  if (ticket.processingStatus === 'FAILED') return true;
  return false;
}

export function isFailedAbandonableTicket(
  ticket: Pick<Ticket, 'shareCode' | 'finalizedAt' | 'processingStatus'> | null | undefined,
): boolean {
  if (!ticket) return false;
  if (ticket.finalizedAt || ticket.shareCode) return false;
  return ticket.processingStatus === 'FAILED';
}
