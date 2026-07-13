import { io, Socket } from "socket.io-client";
import { getAccessToken } from "./tokenStore";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL as string;

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket) {
    if (socket.connected) return socket;
    socket.disconnect();
  }
  socket = io(`${SOCKET_URL}/chat`, {
    // Re-read the token on every (re)connection attempt instead of baking in
    // the value from the moment of the original login. Without this, once
    // the access token silently refreshes (see client.ts's 401 interceptor)
    // any later reconnect — e.g. after a network blip or the tab waking from
    // sleep — keeps retrying with the now-stale token and never succeeds,
    // so messages sent afterwards go nowhere without any visible error.
    auth: (cb) => cb({ token: getAccessToken() ?? token }),
    transports: ["websocket", "polling"],
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function getSocket(): Socket | null {
  return socket;
}
