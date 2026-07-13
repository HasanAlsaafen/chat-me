import { apiClient } from "./client";
import type { Message } from "../types";

export const messagesApi = {
  list: (conversationId: string) =>
    apiClient
      .get<Message[]>(`/messages/${conversationId}`)
      .then((r) => r.data),

  search: (conversationId: string, q: string) =>
    apiClient
      .get<Message[]>(`/messages/${conversationId}/search`, { params: { q } })
      .then((r) => r.data),
};
