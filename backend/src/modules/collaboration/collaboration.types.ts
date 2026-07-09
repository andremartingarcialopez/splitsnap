/** Estados de sesión del ticket (SplitSnap v2 — Parte 5 §12.4). */
export const TICKET_SESSION_STATUS = {
  DRAFT: 'DRAFT',
  CREATED: 'CREATED',
  WAITING_FOR_PARTICIPANTS: 'WAITING_FOR_PARTICIPANTS',
  IN_PROGRESS: 'IN_PROGRESS',
  REVIEWING: 'REVIEWING',
  FINISHED: 'FINISHED',
  REOPENED: 'REOPENED',
  CANCELLED: 'CANCELLED',
} as const;

export type TicketSessionStatus =
  (typeof TICKET_SESSION_STATUS)[keyof typeof TICKET_SESSION_STATUS];

/** Estados de participante en la sesión colaborativa. */
export const PARTICIPANT_SESSION_STATUS = {
  NOT_JOINED: 'NOT_JOINED',
  CONNECTED: 'CONNECTED',
  SELECTING: 'SELECTING',
  COMPLETED: 'COMPLETED',
  DISCONNECTED: 'DISCONNECTED',
  LEFT: 'LEFT',
} as const;

export type ParticipantSessionStatus =
  (typeof PARTICIPANT_SESSION_STATUS)[keyof typeof PARTICIPANT_SESSION_STATUS];

/** Control manual de cobro (sin pasarela de pago). */
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];
