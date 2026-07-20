import { create } from "zustand";
import type { CallType } from "../types";

export type CallPhase =
  | "idle"
  | "outgoing"
  | "incoming"
  | "connecting"
  | "active";

export interface CallPeer {
  id: string;
  name: string;
  avatar?: string;
}

interface CallState {
  phase: CallPhase;
  callId: string | null;
  conversationId: string | null;
  peer: CallPeer | null;
  type: CallType;
  muted: boolean;
  cameraOff: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectedAt: number | null;
  statusMessage: string | null;

  startOutgoing: (args: {
    conversationId: string;
    peer: CallPeer;
    type: CallType;
  }) => void;
  startIncoming: (args: {
    callId: string;
    conversationId: string;
    peer: CallPeer;
    type: CallType;
  }) => void;
  setCallId: (callId: string) => void;
  setActive: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setStatusMessage: (message: string | null) => void;
  setConnecting: () => void;
  toggleMuted: () => void;
  toggleCamera: () => void;
  reset: () => void;
}

const initial = {
  phase: "idle" as CallPhase,
  callId: null,
  conversationId: null,
  peer: null,
  type: "audio" as CallType,
  muted: false,
  cameraOff: false,
  localStream: null,
  remoteStream: null,
  connectedAt: null,
  statusMessage: null,
};

export const useCallStore = create<CallState>()((set, get) => ({
  ...initial,

  startOutgoing: ({ conversationId, peer, type }) =>
    set({
      ...initial,
      phase: "outgoing",
      conversationId,
      peer,
      type,
    }),

  startIncoming: ({ callId, conversationId, peer, type }) =>
    set({
      ...initial,
      phase: "incoming",
      callId,
      conversationId,
      peer,
      type,
    }),

  setCallId: (callId) => set({ callId }),

  setActive: () =>
    set((state) =>
      state.phase === "active" ? state : { phase: "active", connectedAt: Date.now() },
    ),

  setLocalStream: (stream) => set({ localStream: stream }),

  setRemoteStream: (stream) => set({ remoteStream: stream }),

  setStatusMessage: (message) => set({ statusMessage: message }),

  setConnecting: () =>
    set((state) => (state.phase === "active" ? state : { phase: "connecting" })),

  toggleMuted: () => {
    const { localStream, muted } = get();
    localStream?.getAudioTracks().forEach((t) => (t.enabled = muted));
    set({ muted: !muted });
  },

  toggleCamera: () => {
    const { localStream, cameraOff } = get();
    localStream?.getVideoTracks().forEach((t) => (t.enabled = cameraOff));
    set({ cameraOff: !cameraOff });
  },

  reset: () => set({ ...initial }),
}));
