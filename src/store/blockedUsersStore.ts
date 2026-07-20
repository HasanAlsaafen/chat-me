import { create } from "zustand";

interface BlockedUsersState {
  ids: Set<string>;
  setBlocked: (ids: string[]) => void;
  block: (userId: string) => void;
  unblock: (userId: string) => void;
}

export const useBlockedUsersStore = create<BlockedUsersState>()((set, get) => ({
  ids: new Set(),

  setBlocked: (ids) => set({ ids: new Set(ids) }),

  block: (userId) => {
    const next = new Set(get().ids);
    next.add(userId);
    set({ ids: next });
  },

  unblock: (userId) => {
    const next = new Set(get().ids);
    next.delete(userId);
    set({ ids: next });
  },
}));
