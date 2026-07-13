import { apiClient } from "./client";
import type { TokenPair, User } from "../types";

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<TokenPair>("/auth/register", payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    apiClient.post<TokenPair>("/auth/login", payload).then((r) => r.data),

  refresh: () => apiClient.post<TokenPair>("/auth/refresh").then((r) => r.data),

  logout: () =>
    apiClient.post<{ message: string }>("/auth/logout").then((r) => r.data),

  me: () => apiClient.get<User>("/auth/me").then((r) => r.data),

  googleUrl: (apiUrl: string) => `${apiUrl}/auth/google`,
  githubUrl: (apiUrl: string) => `${apiUrl}/auth/github`,
};
