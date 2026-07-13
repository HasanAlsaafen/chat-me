import { create } from "zustand";
import { authApi } from "../api/auth";
import { setAccessToken } from "../lib/tokenStore";
import { connectSocket, disconnectSocket } from "../lib/socket";
import { registerSessionExpiredHandler } from "../api/client";
import type { User } from "../types";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  user: User | null;
  status: AuthStatus;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    displayName: string,
    email: string,
    password: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: "idle",

  init: async () => {
    set({ status: "loading" });
    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      const user = await authApi.me();
      connectSocket(accessToken);
      set({ user, status: "authenticated" });
    } catch {
      setAccessToken(null);
      set({ user: null, status: "unauthenticated" });
    }
  },

  login: async (email, password) => {
    const { accessToken } = await authApi.login({ email, password });
    setAccessToken(accessToken);
    const user = await authApi.me();
    connectSocket(accessToken);
    set({ user, status: "authenticated" });
  },

  register: async (displayName, email, password) => {
    const { accessToken } = await authApi.register({
      displayName,
      email,
      password,
    });
    setAccessToken(accessToken);
    const user = await authApi.me();
    connectSocket(accessToken);
    set({ user, status: "authenticated" });
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      disconnectSocket();
      set({ user: null, status: "unauthenticated" });
    }
  },

  updateUser: (user) => set({ user }),
}));

registerSessionExpiredHandler(() => {
  disconnectSocket();
  useAuthStore.setState({ user: null, status: "unauthenticated" });
});
