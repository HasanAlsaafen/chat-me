import { apiClient } from "./client";
import type { Call, IceServer } from "../types";

export const callsApi = {
  getIceServers: () =>
    apiClient
      .get<{ iceServers: IceServer[] }>("/calls/ice-servers")
      .then((r) => r.data.iceServers),

  getHistory: (params: { conversationId?: string; limit?: number } = {}) =>
    apiClient.get<Call[]>("/calls", { params }).then((r) => r.data),
};
