import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConversationFlags {
  pinned?: boolean;
  muted?: boolean;
  archived?: boolean;
}

interface LocalPrefsState {
  lastReadByConversation: Record<string, string>;
  pinnedMessagesByConversation: Record<string, string[]>;
  conversationFlags: Record<string, ConversationFlags>;

  setLastRead: (conversationId: string, messageId: string) => void;
  togglePinnedMessage: (conversationId: string, messageId: string) => void;
  toggleConversationFlag: (
    conversationId: string,
    flag: keyof ConversationFlags,
  ) => void;
}

export const useLocalPrefsStore = create<LocalPrefsState>()(
  persist(
    (set, get) => ({
      lastReadByConversation: {},
      pinnedMessagesByConversation: {},
      conversationFlags: {},

      setLastRead: (conversationId, messageId) =>
        set({
          lastReadByConversation: {
            ...get().lastReadByConversation,
            [conversationId]: messageId,
          },
        }),

      togglePinnedMessage: (conversationId, messageId) => {
        const current =
          get().pinnedMessagesByConversation[conversationId] ?? [];
        const next = current.includes(messageId)
          ? current.filter((id) => id !== messageId)
          : [...current, messageId];
        set({
          pinnedMessagesByConversation: {
            ...get().pinnedMessagesByConversation,
            [conversationId]: next,
          },
        });
      },

      toggleConversationFlag: (conversationId, flag) => {
        const current = get().conversationFlags[conversationId] ?? {};
        set({
          conversationFlags: {
            ...get().conversationFlags,
            [conversationId]: { ...current, [flag]: !current[flag] },
          },
        });
      },
    }),
    { name: "chatme-local-prefs" },
  ),
);
