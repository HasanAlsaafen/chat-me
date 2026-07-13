import { create } from "zustand";
import type {
  Conversation,
  Message,
  MessageReaction,
  MessageStatusValue,
} from "../types";
import { getId } from "../utils/id";

interface ChatState {
  conversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  activeConversationId: string | null;
  typingByConversation: Record<string, string[]>;

  setConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  removeConversation: (id: string) => void;
  setActiveConversation: (id: string | null) => void;

  addMessage: (conversationId: string, message: Message) => void;
  loadMessages: (conversationId: string, messages: Message[]) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    patch: Partial<Message>,
  ) => void;
  setMessageReceipt: (
    conversationId: string,
    messageIds: string[],
    userId: string,
    status: MessageStatusValue,
  ) => void;

  setReaction: (
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ) => void;
  removeReaction: (
    conversationId: string,
    messageId: string,
    userId: string,
  ) => void;

  setTyping: (conversationId: string, userId: string, typing: boolean) => void;
  clearTyping: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messagesByConversation: {},
  activeConversationId: null,
  typingByConversation: {},

  setConversations: (conversations) => set({ conversations }),

  upsertConversation: (conversation) => {
    const id = getId(conversation);
    const existing = get().conversations;
    const idx = existing.findIndex((c) => getId(c) === id);
    if (idx === -1) {
      set({ conversations: [conversation, ...existing] });
    } else {
      const next = [...existing];
      next[idx] = conversation;
      set({ conversations: next });
    }
  },

  removeConversation: (id) => {
    set({
      conversations: get().conversations.filter((c) => getId(c) !== id),
    });
    const rest = { ...get().messagesByConversation };
    delete rest[id];
    set({ messagesByConversation: rest });
  },

  setActiveConversation: (id) => set({ activeConversationId: id }),

  addMessage: (conversationId, message) => {
    const current = get().messagesByConversation[conversationId] ?? [];
    if (current.some((m) => getId(m) === getId(message))) return;
    set({
      messagesByConversation: {
        ...get().messagesByConversation,
        [conversationId]: [...current, message],
      },
    });
    get().setTyping(conversationId, getId(message.sender), false);

    const conversation = get().conversations.find(
      (c) => getId(c) === conversationId,
    );
    if (conversation) {
      const next = {
        ...conversation,
        lastMessage: message,
        lastMessageAt: message.createdAt,
      };
      const rest = get().conversations.filter(
        (c) => getId(c) !== conversationId,
      );
      set({ conversations: [next, ...rest] });
    }
  },

  loadMessages: (conversationId, messages) => {
    const current = get().messagesByConversation[conversationId] ?? [];
    const merged = [...messages];
    for (const message of current) {
      if (!merged.some((m) => getId(m) === getId(message))) {
        merged.push(message);
      }
    }
    merged.sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt),
    );
    set({
      messagesByConversation: {
        ...get().messagesByConversation,
        [conversationId]: merged,
      },
    });
  },

  updateMessage: (conversationId, messageId, patch) => {
    const current = get().messagesByConversation[conversationId];
    if (!current) return;
    set({
      messagesByConversation: {
        ...get().messagesByConversation,
        [conversationId]: current.map((m) =>
          getId(m) === messageId ? { ...m, ...patch } : m,
        ),
      },
    });
  },

  setMessageReceipt: (conversationId, messageIds, userId, status) => {
    const current = get().messagesByConversation[conversationId];
    if (!current) return;
    const idSet = new Set(messageIds);
    const next = current.map((m) => {
      if (!idSet.has(getId(m))) return m;
      const receipts = m.receipts.some((r) => r.user === userId)
        ? m.receipts.map((r) => (r.user === userId ? { ...r, status } : r))
        : [...m.receipts, { user: userId, status }];
      return { ...m, receipts };
    });
    set({
      messagesByConversation: {
        ...get().messagesByConversation,
        [conversationId]: next,
      },
    });
  },

  setReaction: (conversationId, messageId, userId, emoji) => {
    const current = get().messagesByConversation[conversationId];
    if (!current) return;
    set({
      messagesByConversation: {
        ...get().messagesByConversation,
        [conversationId]: current.map((m) => {
          if (getId(m) !== messageId) return m;
          const reactions: MessageReaction[] = [
            ...m.reactions.filter((r) => r.user !== userId),
            { user: userId, emoji },
          ];
          return { ...m, reactions };
        }),
      },
    });
  },

  removeReaction: (conversationId, messageId, userId) => {
    const current = get().messagesByConversation[conversationId];
    if (!current) return;
    set({
      messagesByConversation: {
        ...get().messagesByConversation,
        [conversationId]: current.map((m) =>
          getId(m) === messageId
            ? { ...m, reactions: m.reactions.filter((r) => r.user !== userId) }
            : m,
        ),
      },
    });
  },

  setTyping: (conversationId, userId, typing) => {
    const current = get().typingByConversation[conversationId] ?? [];
    const next = typing
      ? current.includes(userId)
        ? current
        : [...current, userId]
      : current.filter((id) => id !== userId);
    set({
      typingByConversation: {
        ...get().typingByConversation,
        [conversationId]: next,
      },
    });
  },

  clearTyping: (conversationId) => {
    set({
      typingByConversation: {
        ...get().typingByConversation,
        [conversationId]: [],
      },
    });
  },
}));
