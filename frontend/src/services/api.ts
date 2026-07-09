import type {
  ApiSuccess,
  Group,
  HistoryDetail,
  HistoryListItem,
  Participant,
  ProcessTicketResult,
  Product,
  RemoveParticipantResult,
  ShareInfo,
  Ticket,
  TicketSummary,
} from '../types/domain';
import { api, ApiClientError, PIPELINE_TIMEOUT_MS, unwrap, toClientError } from '../api/client';

export { api, ApiClientError, PIPELINE_TIMEOUT_MS };

export const groupsApi = {
  async list(): Promise<Group[]> {
    try {
      const { data } = await api.get<ApiSuccess<Group[]>>('/groups');
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async get(id: string): Promise<Group> {
    try {
      const { data } = await api.get<ApiSuccess<Group>>(`/groups/${id}`);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async create(input: {
    name: string;
    description?: string | null;
    participantIds?: string[];
  }): Promise<Group> {
    try {
      const { data } = await api.post<ApiSuccess<Group>>('/groups', input);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async update(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      participantIds?: string[];
    },
  ): Promise<Group> {
    try {
      const { data } = await api.put<ApiSuccess<Group>>(`/groups/${id}`, input);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { data } = await api.delete<ApiSuccess<{ id: string }>>(`/groups/${id}`);
      unwrap(data);
    } catch (err) {
      toClientError(err);
    }
  },
};

export const participantsApi = {
  async list(q?: string): Promise<Participant[]> {
    try {
      const { data } = await api.get<ApiSuccess<Participant[]>>('/participants', {
        params: q ? { q } : undefined,
      });
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  /** Sube imagen y devuelve la ruta pública (/uploads/participants/...) */
  async uploadPhoto(image: File): Promise<{ photoUrl: string }> {
    try {
      const form = new FormData();
      form.append('image', image);
      const { data } = await api.post<ApiSuccess<{ photoUrl: string }>>(
        '/participants/photo',
        form,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  /** Resuelve photoUrl: sube archivo nuevo o conserva URL existente */
  async resolvePhoto(input: {
    photoUrl?: string | null;
    photoFile?: File | null;
  }): Promise<string | null> {
    if (input.photoFile) {
      const { photoUrl } = await this.uploadPhoto(input.photoFile);
      return photoUrl;
    }
    return input.photoUrl?.trim() || null;
  },

  async create(input: {
    name?: string | null;
    photoUrl?: string | null;
    photoFile?: File | null;
  }): Promise<Participant> {
    try {
      const photoUrl = await this.resolvePhoto(input);
      const { data } = await api.post<ApiSuccess<Participant>>('/participants', {
        name: input.name?.trim() || null,
        photoUrl,
      });
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async update(
    id: string,
    input: {
      name?: string | null;
      photoUrl?: string | null;
      photoFile?: File | null;
    },
  ): Promise<Participant> {
    try {
      const payload: { name?: string | null; photoUrl?: string | null } = {};
      if (input.name !== undefined) {
        payload.name = input.name?.trim() || null;
      }
      if (input.photoFile !== undefined || input.photoUrl !== undefined) {
        payload.photoUrl = await this.resolvePhoto(input);
      }
      const { data } = await api.put<ApiSuccess<Participant>>(`/participants/${id}`, payload);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { data } = await api.delete<ApiSuccess<{ id: string }>>(`/participants/${id}`);
      unwrap(data);
    } catch (err) {
      toClientError(err);
    }
  },
};

export const ticketsApi = {
  async list(): Promise<Ticket[]> {
    try {
      const { data } = await api.get<ApiSuccess<Ticket[]>>('/tickets');
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async create(input: {
    title?: string;
    restaurantName?: string | null;
    products?: Array<{ name: string; unitPrice: number }>;
    participantIds?: string[];
    groupIds?: string[];
  }): Promise<Ticket> {
    try {
      const { data } = await api.post<ApiSuccess<Ticket>>('/tickets', input);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async process(image: File): Promise<ProcessTicketResult> {
    try {
      const form = new FormData();
      form.append('image', image);
      const { data } = await api.post<ApiSuccess<ProcessTicketResult>>(
        '/tickets/process',
        form,
        { timeout: PIPELINE_TIMEOUT_MS },
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async get(id: string): Promise<Ticket> {
    try {
      const { data } = await api.get<ApiSuccess<Ticket>>(`/tickets/${id}`);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { data } = await api.delete<ApiSuccess<{ id: string }>>(`/tickets/${id}`);
      unwrap(data);
    } catch (err) {
      toClientError(err);
    }
  },

  async createManual(input: {
    title?: string;
    restaurantName?: string | null;
    products: Array<{ name: string; unitPrice: number }>;
  }): Promise<Ticket> {
    try {
      const { data } = await api.post<ApiSuccess<Ticket>>('/tickets/manual', input);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async addParticipant(
    ticketId: string,
    input: { participantId: string; individualTipPercentage?: number | null },
  ): Promise<Ticket> {
    try {
      const { data } = await api.post<ApiSuccess<Ticket>>(
        `/tickets/${ticketId}/participants`,
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async removeParticipant(
    ticketId: string,
    participantId: string,
  ): Promise<RemoveParticipantResult> {
    try {
      const { data } = await api.delete<ApiSuccess<RemoveParticipantResult>>(
        `/tickets/${ticketId}/participants/${participantId}`,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async previewRemoveParticipant(
    ticketId: string,
    participantId: string,
  ): Promise<{ orphanedProducts: Array<{ id: string; name: string }> }> {
    try {
      const { data } = await api.get<
        ApiSuccess<{ orphanedProducts: Array<{ id: string; name: string }> }>
      >(`/tickets/${ticketId}/participants/${participantId}/remove-preview`);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async updateTip(
    ticketId: string,
    input: { tipMode: 'GLOBAL' | 'INDIVIDUAL'; globalTipPercentage: number },
  ): Promise<Ticket> {
    try {
      const { data } = await api.put<ApiSuccess<Ticket>>(`/tickets/${ticketId}/tip`, input);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async updateParticipantTip(
    ticketId: string,
    participantId: string,
    individualTipPercentage: number,
  ): Promise<Ticket> {
    try {
      const { data } = await api.put<ApiSuccess<Ticket>>(
        `/tickets/${ticketId}/participants/${participantId}/tip`,
        { individualTipPercentage },
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async getSummary(ticketId: string): Promise<TicketSummary> {
    try {
      const { data } = await api.get<ApiSuccess<TicketSummary>>(
        `/tickets/${ticketId}/summary`,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async calculate(ticketId: string): Promise<TicketSummary> {
    try {
      const { data } = await api.post<ApiSuccess<TicketSummary>>(
        `/tickets/${ticketId}/calculate`,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async finalize(ticketId: string): Promise<Ticket> {
    try {
      const { data } = await api.post<ApiSuccess<Ticket>>(`/tickets/${ticketId}/finalize`);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async linkGroup(ticketId: string, groupId: string): Promise<Ticket> {
    try {
      const { data } = await api.post<ApiSuccess<Ticket>>(`/tickets/${ticketId}/groups`, {
        groupId,
      });
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async addProduct(
    ticketId: string,
    input: { name: string; unitPrice: number },
  ): Promise<Product> {
    try {
      const { data } = await api.post<ApiSuccess<Product>>(
        `/tickets/${ticketId}/products`,
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async updateProduct(
    ticketId: string,
    productId: string,
    input: { name?: string; unitPrice?: number },
  ): Promise<Product> {
    try {
      const { data } = await api.put<ApiSuccess<Product>>(
        `/tickets/${ticketId}/products/${productId}`,
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async deleteProduct(ticketId: string, productId: string): Promise<void> {
    try {
      const { data } = await api.delete<ApiSuccess<{ id: string }>>(
        `/tickets/${ticketId}/products/${productId}`,
      );
      unwrap(data);
    } catch (err) {
      toClientError(err);
    }
  },

  async setupAdmin(
    ticketId: string,
    input: { displayName: string; avatarId?: string },
  ): Promise<Ticket> {
    try {
      const { data } = await api.post<ApiSuccess<Ticket>>(
        `/tickets/${ticketId}/admin-setup`,
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async updateCollaborationSettings(
    ticketId: string,
    input: {
      globalTipPercentage?: number;
      expectedParticipantCount?: number | null;
    },
  ): Promise<Ticket> {
    try {
      const { data } = await api.patch<ApiSuccess<Ticket>>(
        `/tickets/${ticketId}/collaboration-settings`,
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async startDivision(
    ticketId: string,
    input?: {
      globalTipPercentage?: number;
      expectedParticipantCount?: number;
    },
  ): Promise<ShareInfo> {
    try {
      const { data } = await api.post<ApiSuccess<ShareInfo>>(
        `/tickets/${ticketId}/start-division`,
        input ?? {},
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async getShareInfo(ticketId: string): Promise<ShareInfo> {
    try {
      const { data } = await api.get<ApiSuccess<ShareInfo>>(`/tickets/${ticketId}/share`);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },
};

export type ProductAssignmentDto = {
  id: string;
  productId: string;
  participantId: string;
  shareRatio: number;
  createdAt: string;
  participant?: Participant;
  product?: {
    id: string;
    ticketId: string;
    name: string;
    unitPrice: number;
  };
};

export const productsApi = {
  async create(input: {
    ticketId: string;
    name: string;
    unitPrice: number;
  }): Promise<Product> {
    try {
      const { data } = await api.post<ApiSuccess<Product>>('/products', input);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async update(
    id: string,
    input: { name?: string; unitPrice?: number },
  ): Promise<Product> {
    try {
      const { data } = await api.put<ApiSuccess<Product>>(`/products/${id}`, input);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { data } = await api.delete<ApiSuccess<{ id: string }>>(`/products/${id}`);
      unwrap(data);
    } catch (err) {
      toClientError(err);
    }
  },
};

export const assignmentsApi = {
  async listByTicket(ticketId: string): Promise<ProductAssignmentDto[]> {
    try {
      const { data } = await api.get<ApiSuccess<ProductAssignmentDto[]>>(
        `/tickets/${ticketId}/assignments`,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async assignOne(input: {
    productId: string;
    participantId: string;
    shareRatio?: number;
  }): Promise<ProductAssignmentDto> {
    try {
      const { data } = await api.post<ApiSuccess<ProductAssignmentDto>>(
        '/assignments',
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async assignShared(input: {
    productId: string;
    participantIds: string[];
    shareRatios?: number[];
  }): Promise<ProductAssignmentDto[]> {
    try {
      const { data } = await api.post<ApiSuccess<ProductAssignmentDto[]>>(
        '/assignments/shared',
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async remove(id: string): Promise<void> {
    try {
      const { data } = await api.delete<ApiSuccess<{ id: string }>>(
        `/assignments/${id}`,
      );
      unwrap(data);
    } catch (err) {
      toClientError(err);
    }
  },
};

export const historyApi = {
  async list(): Promise<HistoryListItem[]> {
    try {
      const { data } = await api.get<ApiSuccess<HistoryListItem[]>>('/history');
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async get(id: string): Promise<HistoryDetail> {
    try {
      const { data } = await api.get<ApiSuccess<HistoryDetail>>(`/history/${id}`);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },
};
