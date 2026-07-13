import { apiClient } from "./client";
import type { User } from "../types";

export interface UpdateProfilePayload {
  displayName?: string;
  bio?: string;
}

export const usersApi = {
  search: (q: string) =>
    apiClient
      .get<User[]>("/users/search", { params: { q } })
      .then((r) => r.data),

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
