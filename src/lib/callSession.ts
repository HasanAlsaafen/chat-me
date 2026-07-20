import toast from "react-hot-toast";
import { getSocket } from "./socket";
import { callsApi } from "../api/calls";
import { useAuthStore } from "../store/authStore";
import { useCallStore, type CallPeer } from "../store/callStore";
import { getId } from "../utils/id";
import type { CallEndReason, CallType, IceServer } from "../types";

interface IncomingCallPayload {
  callId: string;
  conversationId: string;
  callerId: string;
  type: CallType;
  callerName?: string;
  callerAvatar?: string;
}

interface SdpPayload {
  callId: string;
  sdp: RTCSessionDescriptionInit;
  from?: string;
}

interface IceCandidatePayload {
  callId: string;
  candidate: RTCIceCandidateInit;
  from?: string;
}

interface CallEndedPayload {
  callId: string;
  reason: CallEndReason | "no_longer_available";
}

const reasonMessages: Record<CallEndedPayload["reason"], string> = {
  rejected: "Call declined",
  ended: "Call ended",
  no_answer: "No answer",
  unavailable: "User is offline",
  disconnected: "Call disconnected",
  no_longer_available: "Call ended before you answered",
};

let pc: RTCPeerConnection | null = null;
let pendingCandidates: RTCIceCandidateInit[] = [];
let pendingOffer: RTCSessionDescriptionInit | null = null;
let iceServers: IceServer[] = [];
let isOfferer = false;
let iceRecoveryTimer: ReturnType<typeof setTimeout> | null = null;

// Every call attempt captures the current generation. Any async step
// (getUserMedia, the call_invite ack, offer/answer creation) checks it's
// still current before touching shared state — otherwise a fast
// call_busy/call_ended/abort that lands mid-await would be clobbered by a
// stale continuation finishing afterwards.
let generation = 0;
const isStale = (seq: number) => seq !== generation;

function clearIceRecoveryTimer() {
  if (iceRecoveryTimer) clearTimeout(iceRecoveryTimer);
  iceRecoveryTimer = null;
}

function cleanup() {
  generation += 1;
  clearIceRecoveryTimer();
  pc?.getSenders().forEach((sender) => sender.track?.stop());
  pc?.close();
  pc = null;
  pendingCandidates = [];
  pendingOffer = null;
  isOfferer = false;
  useCallStore.getState().localStream?.getTracks().forEach((t) => t.stop());
}

function abort() {
  cleanup();
  useCallStore.getState().reset();
}

const VALID_ICE_URL = /^(stun|stuns|turn|turns):/i;

function sanitizeIceServers(servers: IceServer[]): IceServer[] {
  return servers.reduce<IceServer[]>((acc, server) => {
    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
    const validUrls = urls.filter((url) => VALID_ICE_URL.test(url));
    if (validUrls.length === 0) {
      console.warn("[call] dropping ICE server with invalid url(s)", server.urls);
      return acc;
    }
    if (validUrls.length !== urls.length) {
      console.warn("[call] dropping invalid url(s) from ICE server", server.urls);
    }
    acc.push({ ...server, urls: validUrls });
    return acc;
  }, []);
}

async function ensureIceServers() {
  if (iceServers.length === 0) {
    try {
      iceServers = sanitizeIceServers(await callsApi.getIceServers());
    } catch {
      iceServers = [];
    }
  }
  return iceServers;
}

function flushPendingCandidates(conn: RTCPeerConnection) {
  pendingCandidates.splice(0).forEach((candidate) => {
    void conn.addIceCandidate(candidate);
  });
}

function attemptIceRestart(callId: string, conn: RTCPeerConnection) {
  useCallStore.getState().setStatusMessage("Reconnecting…");
  if (isOfferer) {
    void conn
      .createOffer({ iceRestart: true })
      .then((offer) => conn.setLocalDescription(offer).then(() => offer))
      .then((offer) => {
        getSocket()?.emit("call_offer", { callId, sdp: offer });
      })
      .catch(() => {
        // Renegotiation failed to even start — the 10s recovery timer
        // below still owns declaring the call dead.
      });
  }

  clearIceRecoveryTimer();
  iceRecoveryTimer = setTimeout(() => {
    if (pc !== conn) return;
    const state = conn.iceConnectionState;
    if (state === "connected" || state === "completed") return;
    toast.error("Connection lost");
    hangUp();
  }, 10000);
}

function createPeerConnection(callId: string) {
  const conn = new RTCPeerConnection({ iceServers });

  conn.onicecandidate = (event) => {
    if (!event.candidate) return;
    getSocket()?.emit("ice_candidate", {
      callId,
      candidate: event.candidate.toJSON(),
    });
  };

  conn.ontrack = (event) => {
    useCallStore.getState().setRemoteStream(event.streams[0] ?? null);
  };

  conn.oniceconnectionstatechange = () => {
    if (conn.iceConnectionState === "connected" || conn.iceConnectionState === "completed") {
      clearIceRecoveryTimer();
      useCallStore.getState().setStatusMessage(null);
      useCallStore.getState().setActive();
    } else if (conn.iceConnectionState === "failed") {
      attemptIceRestart(callId, conn);
    }
  };

  pc = conn;
  return conn;
}

async function getLocalStream(type: CallType) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: type === "video",
    });
    useCallStore.getState().setLocalStream(stream);
    return stream;
  } catch (err) {
    console.error("[call] getUserMedia failed", err);
    toast.error("Couldn't access camera/microphone");
    throw err;
  }
}

/** Applies an SDP offer to an already-created peer connection and answers it. Used both for the first offer and for later renegotiation (e.g. an ICE restart). */
async function answerOffer(callId: string, sdp: RTCSessionDescriptionInit, seq: number) {
  if (!pc || isStale(seq)) return;
  await pc.setRemoteDescription(sdp);
  flushPendingCandidates(pc);
  const answer = await pc.createAnswer();
  if (isStale(seq)) return;
  await pc.setLocalDescription(answer);
  getSocket()?.emit("call_answer", { callId, sdp: answer });
  useCallStore.getState().setConnecting();
}

export function hangUp() {
  const { callId } = useCallStore.getState();
  if (callId) getSocket()?.emit("call_end", { callId });
  abort();
}

export function rejectCall() {
  const { callId } = useCallStore.getState();
  if (callId) getSocket()?.emit("call_reject", { callId });
  abort();
}

export async function startCall(
  conversationId: string,
  type: CallType,
  peer: CallPeer,
) {
  const seq = ++generation;
  useCallStore.getState().startOutgoing({ conversationId, peer, type });
  const socket = getSocket();
  if (!socket) {
    abort();
    return;
  }

  await ensureIceServers();
  if (isStale(seq)) return;

  let stream: MediaStream;
  try {
    stream = await getLocalStream(type);
  } catch {
    abort();
    return;
  }
  if (isStale(seq)) {
    stream.getTracks().forEach((t) => t.stop());
    return;
  }

  socket.emit(
    "call_invite",
    { conversationId, type },
    (ack: { callId?: string; error?: string } | undefined) => {
      if (isStale(seq)) return;
      if (!ack?.callId) {
        toast.error(ack?.error ?? "Unable to start call");
        abort();
        return;
      }
      isOfferer = true;
      useCallStore.getState().setCallId(ack.callId);

      let conn: RTCPeerConnection;
      try {
        conn = createPeerConnection(ack.callId);
        stream.getTracks().forEach((track) => conn.addTrack(track, stream));
      } catch (err) {
        console.error("[call] failed to set up peer connection", err);
        toast.error("Couldn't connect the call");
        abort();
        return;
      }

      conn
        .createOffer()
        .then((offer) => conn.setLocalDescription(offer).then(() => offer))
        .then((offer) => {
          if (isStale(seq)) return;
          socket.emit("call_offer", { callId: ack.callId, sdp: offer });
        })
        .catch((err) => {
          console.error("[call] failed to create/send offer", err);
          if (isStale(seq)) return;
          toast.error("Couldn't connect the call");
          abort();
        });
    },
  );
}

export async function acceptCall() {
  const { callId, type } = useCallStore.getState();
  const socket = getSocket();
  if (!callId || !socket) return;
  const seq = generation;

  await ensureIceServers();
  if (isStale(seq)) return;

  let stream: MediaStream;
  try {
    stream = await getLocalStream(type);
  } catch {
    rejectCall();
    return;
  }
  if (isStale(seq)) {
    stream.getTracks().forEach((t) => t.stop());
    return;
  }

  isOfferer = false;
  try {
    const conn = createPeerConnection(callId);
    stream.getTracks().forEach((track) => conn.addTrack(track, stream));
  } catch (err) {
    console.error("[call] failed to set up peer connection", err);
    toast.error("Couldn't connect the call");
    rejectCall();
    return;
  }

  if (pendingOffer) {
    const offer = pendingOffer;
    pendingOffer = null;
    try {
      await answerOffer(callId, offer, seq);
    } catch (err) {
      console.error("[call] failed to answer offer", err);
      toast.error("Couldn't connect the call");
      rejectCall();
    }
  }
  // If the offer hasn't arrived yet, `pc` now exists so the call_offer
  // handler below will answer it as soon as it does.
}

export function bindCallListeners(): () => void {
  const socket = getSocket();
  if (!socket) return () => {};

  const handleIncomingCall = (data: IncomingCallPayload) => {
    const state = useCallStore.getState();
    const currentUser = useAuthStore.getState().user;
    const currentUserId = currentUser ? getId(currentUser) : "";

    const isGlare =
      state.phase === "outgoing" &&
      state.conversationId === data.conversationId &&
      state.peer?.id === data.callerId;

    if (isGlare) {
      if (currentUserId && currentUserId < data.callerId) {
        // We keep our own outgoing call; the other side resolves the tie
        // by yielding to ours and answering it instead. Decline this
        // duplicate silently — it's not a user-facing rejection.
        socket.emit("call_reject", { callId: data.callId });
        return;
      }
      // We yield: abandon our outgoing attempt and become the callee.
      const seq = ++generation;
      if (state.callId) socket.emit("call_end", { callId: state.callId });
      cleanup();
      if (isStale(seq)) return;
      useCallStore.getState().startIncoming({
        callId: data.callId,
        conversationId: data.conversationId,
        peer: state.peer ?? {
          id: data.callerId,
          name: data.callerName ?? "Unknown caller",
          avatar: data.callerAvatar,
        },
        type: data.type,
      });
      return;
    }

    if (state.phase !== "idle") {
      socket.emit("call_reject", { callId: data.callId });
      return;
    }

    ++generation;
    useCallStore.getState().startIncoming({
      callId: data.callId,
      conversationId: data.conversationId,
      peer: {
        id: data.callerId,
        name: data.callerName ?? "Unknown caller",
        avatar: data.callerAvatar,
      },
      type: data.type,
    });
  };

  const handleOffer = (data: SdpPayload) => {
    const { callId } = useCallStore.getState();
    if (callId !== data.callId) return;
    const seq = generation;
    if (pc) {
      answerOffer(data.callId, data.sdp, seq).catch((err) => {
        console.error("[call] failed to answer offer", err);
        if (isStale(seq)) return;
        toast.error("Couldn't connect the call");
        hangUp();
      });
    } else {
      // acceptCall() hasn't run yet — hold onto it.
      pendingOffer = data.sdp;
    }
  };

  const handleAnswer = async (data: SdpPayload) => {
    if (!pc || useCallStore.getState().callId !== data.callId) return;
    const seq = generation;
    try {
      await pc.setRemoteDescription(data.sdp);
    } catch (err) {
      console.error("[call] failed to apply answer", err);
      if (!isStale(seq)) {
        toast.error("Couldn't connect the call");
        hangUp();
      }
      return;
    }
    if (isStale(seq) || !pc) return;
    flushPendingCandidates(pc);
    useCallStore.getState().setConnecting();
  };

  const handleIceCandidate = async (data: IceCandidatePayload) => {
    if (useCallStore.getState().callId !== data.callId) return;
    if (pc?.remoteDescription) {
      await pc.addIceCandidate(data.candidate);
    } else {
      pendingCandidates.push(data.candidate);
    }
  };

  const handleCallEnded = (data: CallEndedPayload) => {
    if (useCallStore.getState().callId !== data.callId) return;
    if (data.reason !== "ended") {
      toast(reasonMessages[data.reason] ?? "Call ended");
    }
    abort();
  };

  const handleAnsweredElsewhere = (data: { callId: string }) => {
    if (useCallStore.getState().callId !== data.callId) return;
    // Another of our own devices took the call — dismiss silently.
    abort();
  };

  const handleBusy = () => {
    toast("User is busy on another call");
    abort();
  };

  const handleError = (_data: { message: string }) => {
    // A generic validation error (blocked user, not a member, group
    // conversation, callee not found, ...). The toast for it is already
    // shown by the app-wide error handler; here we just make sure a call
    // attempt in flight doesn't get stuck.
    if (useCallStore.getState().phase !== "idle") abort();
  };

  socket.on("incoming_call", handleIncomingCall);
  socket.on("call_offer", handleOffer);
  socket.on("call_answer", handleAnswer);
  socket.on("ice_candidate", handleIceCandidate);
  socket.on("call_ended", handleCallEnded);
  socket.on("call_answered_elsewhere", handleAnsweredElsewhere);
  socket.on("call_busy", handleBusy);
  socket.on("error", handleError);

  return () => {
    socket.off("incoming_call", handleIncomingCall);
    socket.off("call_offer", handleOffer);
    socket.off("call_answer", handleAnswer);
    socket.off("ice_candidate", handleIceCandidate);
    socket.off("call_ended", handleCallEnded);
    socket.off("call_answered_elsewhere", handleAnsweredElsewhere);
    socket.off("call_busy", handleBusy);
    socket.off("error", handleError);
  };
}
