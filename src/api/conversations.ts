import { apiClient } from "./client";
import type { Conversation } from "../types";

export const conversationsApi = {
  list: () =>
    apiClient.get<Conversation[]>("/conversations").then((r) => r.data),

  search: (q: string) =>
    apiClient
      .get<Conversation[]>("/conversations/search", { params: { q } })
      .then((r) => r.data),

  createDirect: (userId: string) =>
    apiClient
      .post<Conversation>("/conversations/direct", { userId })
      .then((r) => r.data),

  createGroup: (name: string, memberIds: string[]) =>
    apiClient
      .post<Conversation>("/conversations/group", { name, memberIds })
      .then((r) => r.data),

  addMembers: (conversationId: string, memberIds: string[]) =>
    apiClient
      .patch<Conversation>(`/conversations/${conversationId}/members`, {
        memberIds,
      })
      .then((r) => r.data),

  removeMember: (conversationId: string, userId: string) =>
    apiClient
      .delete<Conversation>(
        `/conversations/${conversationId}/members/${userId}`,
      )
      .then((r) => r.data),

  renameGroup: (conversationId: string, name: string) =>
    apiClient
      .patch<Conversation>(`/conversations/${conversationId}/name`, { name })
      .then((r) => r.data),

  leave: (conversationId: string) =>
    apiClient
      .post<void>(`/conversations/${conversationId}/leave`)
      .then((r) => r.data),
};
