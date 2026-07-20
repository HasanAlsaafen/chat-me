import { create } from "zustand";
import type { Notification, NewMessageNotificationPayload } from "../types";
import { getId } from "../utils/id";

interface NotificationState {
  unread: Notification[];
  count: number;
  setUnread: (list: Notification[]) => void;
  setCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  markConversationAsRead: (conversationId: string) => Notification[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  unread: [],
  count: 0,

  setUnread: (list) => set({ unread: list }),
  setCount: (count) => set({ count }),

  addNotification: (notification) =>
    set({ unread: [notification, ...get().unread], count: get().count + 1 }),

  markAsRead: (id) => {
    const wasUnread = get().unread.some((n) => getId(n) === id);
    set({
      unread: get().unread.filter((n) => getId(n) !== id),
      count: wasUnread ? Math.max(0, get().count - 1) : get().count,
    });
  },

  markAllAsRead: () => set({ unread: [], count: 0 }),

  markConversationAsRead: (conversationId) => {
    const removed = get().unread.filter(
      (n) =>
        n.type === "new_message" &&
        (n.payload as NewMessageNotificationPayload).conversationId ===
          conversationId,
    );
    if (removed.length === 0) return [];
    const removedIds = new Set(removed.map((n) => getId(n)));
    set({
      unread: get().unread.filter((n) => !removedIds.has(getId(n))),
      count: Math.max(0, get().count - removed.length),
    });
    return removed;
  },
}));
