export type Group = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  participantCount?: number;
  participants?: Participant[];
};

export type Participant = {
  id: string;
  name: string | null;
  photoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductAssignment = {
  id: string;
  productId: string;
  participantId: string;
  shareRatio: number;
  createdAt: string;
  participant?: Participant;
};

export type Product = {
  id: string;
  ticketId: string;
  name: string;
  unitPrice: number;
  detectedByAI: boolean;
  confidenceScore: number | null;
  lineGroupId?: string | null;
  isIndivisible?: boolean;
  emoji?: string | null;
  createdAt: string;
  assignments?: ProductAssignment[];
};

export type TicketParticipantLink = {
  id: string;
  ticketId: string;
  participantId: string;
  individualTipPercentage: number | null;
  sessionStatus?: string;
  paymentStatus?: string;
  isAdmin?: boolean;
  avatarId?: string | null;
  displayName?: string | null;
  selectionSubmittedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  participant: Participant;
};

export type TicketGroupLink = {
  id: string;
  ticketId: string;
  groupId: string;
  createdAt: string;
  group: Group;
};

export type Ticket = {
  id: string;
  title: string;
  restaurantName: string | null;
  ticketImageUrl: string;
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  total: number | null;
  /** Total impreso en el recibo físico (referencia del escaneo) */
  printedTotal?: number | null;
  /** Tasa de impuesto efectiva fijada al escanear */
  scanTaxRate?: number | null;
  tipMode: string;
  globalTipPercentage: number | null;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
  sessionStatus?: string;
  shareCode?: string | null;
  expectedParticipantCount?: number | null;
  divisionStartedAt?: string | null;
  failureReason?: string | null;
  rawOcrText?: string | null;
  finalizedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
  participants?: TicketParticipantLink[];
  groups?: TicketGroupLink[];
  productCount?: number;
  participantCount?: number;
};

export type ProcessTicketResult = {
  ticket: Ticket;
  products: Product[];
  pipeline: { mock: boolean };
};

export type ParticipantSummary = {
  ticketParticipantId?: string;
  participantId: string;
  name: string | null;
  subtotal: number;
  taxPortion: number;
  discountPortion: number;
  subtotalWithTax: number;
  tip: number;
  total: number;
  tipPercentage: number;
  paymentStatus?: string;
  sessionStatus?: string;
};

export type TicketSummary = {
  participants: ParticipantSummary[];
  grandTotal: number;
  ticketSubtotal: number;
  ticketTax: number;
  ticketDiscount: number;
  ticketTotal: number;
  tipMode: string;
  globalTipPercentage: number | null;
  canFinalize: boolean;
  allParticipantsCompleted?: boolean;
  allParticipantsPaid?: boolean;
  canClose?: boolean;
  unassignedProducts: Array<{ id: string; name: string }>;
  varianceWarning: boolean;
  varianceAmount: number | null;
};

export type RemoveParticipantResult = {
  ticket: Ticket;
  orphanedProducts: Array<{ id: string; name: string }>;
};

export type HistoryListItem = {
  id: string;
  title: string;
  restaurantName: string | null;
  total: number | null;
  grandTotal: number;
  createdAt: string;
  finalizedAt: string;
  participantCount: number;
  productCount: number;
  participantNames: string[];
};

export type HistoryDetail = {
  ticket: Ticket;
  summary: TicketSummary;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiFailure = {
  success: false;
  message: string;
  error: {
    code: string;
    details: unknown;
  };
};

export type ShareInfo = {
  ticketId: string;
  shareCode: string;
  sessionStatus: string;
  divisionStartedAt: string | null;
  expectedParticipantCount: number | null;
  globalTipPercentage: number | null;
  publicPath: string;
};

export type PublicProductAssignee = {
  participantId: string;
  displayName: string;
  avatarId: string | null;
};

export type PublicProduct = {
  id: string;
  name: string;
  unitPrice: number;
  emoji: string | null;
  isIndivisible: boolean;
  assignmentCount: number;
  isShared: boolean;
  assignees: PublicProductAssignee[];
};

export type PublicParticipant = {
  id: string;
  displayName: string;
  avatarId: string | null;
  isAdmin: boolean;
  sessionStatus: string;
  paymentStatus: string;
  selectionSubmittedAt: string | null;
};

export type PublicTicket = {
  id: string;
  shareCode: string | null;
  title: string;
  restaurantName: string | null;
  sessionStatus: string;
  processingStatus: string;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  globalTipPercentage: number | null;
  expectedParticipantCount: number | null;
  productCount: number;
  participantCount: number;
  completedParticipantCount: number;
  isFinalized: boolean;
  invitedBy: string;
  products: PublicProduct[];
  participants: PublicParticipant[];
};

export type ParticipantSession = {
  ticketParticipantId: string;
  participantId: string;
  displayName: string;
  avatarId: string | null;
  sessionStatus: string;
  selectionSubmittedAt: string | null;
  selectedProductIds: string[];
  selectedProducts: Array<{
    id: string;
    name: string;
    unitPrice: number;
    emoji: string | null;
  }>;
  subtotal: number;
  tipPercentage: number;
  tip: number;
  total: number;
  canEdit: boolean;
};

export type PublicSessionResponse = {
  ticket: PublicTicket;
  session: ParticipantSession;
};

export type CollaborationRealtimeEvent =
  | 'ticket_started'
  | 'participant_joined'
  | 'participant_started'
  | 'product_selected'
  | 'product_unselected'
  | 'participant_completed'
  | 'ticket_status_changed'
  | 'payment_status_changed'
  | 'ticket_finalized';

export type TicketUpdatedPayload = {
  event: CollaborationRealtimeEvent;
  ticket: PublicTicket;
  at: string;
};
