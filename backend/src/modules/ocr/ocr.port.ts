export type OcrImageInput = {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
};

export interface OcrPort {
  extractText(image: OcrImageInput): Promise<string>;
}

export type ParsedTicketItem = {
  name: string;
  unitPrice: number;
  quantity?: number;
  indivisible?: boolean;
  confidenceScore?: number | null;
};

export type ParsedTicket = {
  restaurantName: string | null;
  items: ParsedTicketItem[];
  subtotal: number | null;
  tax: number | null;
  discount: number | null;
  total: number | null;
  warnings?: string[];
  confidence?: number | null;
  parsingNotes?: string | null;
};

export interface TicketParserPort {
  parseTicket(cleanText: string): Promise<ParsedTicket>;
}
