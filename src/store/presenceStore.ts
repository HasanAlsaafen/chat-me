import { create } from "zustand";

interface PresenceEntry {
  online: boolean;
  lastSeenAt?: string;
}

interface PresenceState {
  byUserId: Record<string, PresenceEntry>;
  setOnline: (userId: string) => void;
  setOffline: (userId: string, lastSeenAt: string) => void;
  setPresence: (userId: string, entry: PresenceEntry) => void;
}

export const usePresenceStore = create<PresenceState>()((set) => ({
  byUserId: {},

  setOnline: (userId) =>
    set((state) => ({
      byUserId: { ...state.byUserId, [userId]: { online: true } },
    })),

  setOffline: (userId, lastSeenAt) =>
    set((state) => ({
      byUserId: { ...state.byUserId, [userId]: { online: false, lastSeenAt } },
    })),

  setPresence: (userId, entry) =>
    set((state) => ({
      byUserId: { ...state.byUserId, [userId]: entry },
    })),
}));
