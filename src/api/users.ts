import { apiClient } from "./client";
import type { User } from "../types";

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
}

export interface UserPresence {
  userId: string;
  online: boolean;
  lastSeenAt?: string;
}

export const usersApi = {
  search: (q: string) =>
    apiClient
      .get<User[]>("/users/search", { params: { q } })
      .then((r) => r.data),

  getPresence: (id: string) =>
    apiClient.get<UserPresence>(`/users/${id}/presence`).then((r) => r.data),

  block: (id: string) =>
    apiClient.post<void>(`/users/${id}/block`).then((r) => r.data),

  unblock: (id: string) =>
    apiClient.delete<void>(`/users/${id}/block`).then((r) => r.data),

  listBlocked: () =>
    apiClient.get<User[]>("/users/blocked").then((r) => r.data),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient.patch<User>("/users/me", payload).then((r) => r.data),

  updateAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiClient
      .patch<User>("/users/me/avatar", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
