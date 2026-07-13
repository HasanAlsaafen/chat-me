import { apiClient } from "./client";
import type { Notification } from "../types";

export const notificationsApi = {
  listUnread: () =>
    apiClient.get<Notification[]>("/notifications").then((r) => r.data),

  count: () =>
    apiClient.get<number>("/notifications/count").then((r) => r.data),

  markAsRead: (id: string) =>
    apiClient.patch<void>(`/notifications/${id}/read`).then((r) => r.data),

  markAllAsRead: () =>
    apiClient.patch<void>("/notifications/read-all").then((r) => r.data),
};
