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
  createdAt: string;
  assignments?: ProductAssignment[];
};

export type TicketParticipantLink = {
  id: string;
  ticketId: string;
  participantId: string;
  individualTipPercentage: number | null;
  createdAt: string;
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
  tipMode: string;
  globalTipPercentage: number | null;
  processingStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | string;
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
  participantId: string;
  name: string | null;
  subtotal: number;
  taxPortion: number;
  discountPortion: number;
  subtotalWithTax: number;
  tip: number;
  total: number;
  tipPercentage: number;
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
