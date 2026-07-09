import type {
  ApiSuccess,
  PublicSessionResponse,
  PublicTicket,
} from '../types/domain';
import { api, ApiClientError, unwrap, toClientError } from '../api/client';

export { ApiClientError };

export const publicApi = {
  async getTicket(shareCode: string): Promise<PublicTicket> {
    try {
      const code = shareCode.toUpperCase();
      const { data } = await api.get<ApiSuccess<PublicTicket>>(`/public/tickets/${code}`);
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async join(
    shareCode: string,
    input: {
      displayName?: string;
      avatarId?: string;
      ticketParticipantId?: string;
    },
  ): Promise<PublicSessionResponse> {
    try {
      const code = shareCode.toUpperCase();
      const { data } = await api.post<ApiSuccess<PublicSessionResponse>>(
        `/public/tickets/${code}/join`,
        input,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async getSession(
    shareCode: string,
    ticketParticipantId: string,
  ): Promise<PublicSessionResponse> {
    try {
      const code = shareCode.toUpperCase();
      const { data } = await api.get<ApiSuccess<PublicSessionResponse>>(
        `/public/tickets/${code}/participants/${ticketParticipantId}`,
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async toggleProduct(
    shareCode: string,
    ticketParticipantId: string,
    productId: string,
  ): Promise<PublicSessionResponse> {
    try {
      const code = shareCode.toUpperCase();
      const { data } = await api.post<ApiSuccess<PublicSessionResponse>>(
        `/public/tickets/${code}/participants/${ticketParticipantId}/toggle-product`,
        { productId },
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },

  async submitSelection(
    shareCode: string,
    ticketParticipantId: string,
  ): Promise<PublicSessionResponse> {
    try {
      const code = shareCode.toUpperCase();
      const { data } = await api.post<ApiSuccess<PublicSessionResponse>>(
        `/public/tickets/${code}/participants/${ticketParticipantId}/submit`,
        {},
      );
      return unwrap(data);
    } catch (err) {
      return toClientError(err);
    }
  },
};
