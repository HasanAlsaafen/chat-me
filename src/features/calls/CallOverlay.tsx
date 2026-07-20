import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Mic, MicOff, Phone, PhoneOff, Video, VideoOff } from "lucide-react";
import clsx from "clsx";
import { Avatar } from "../../components/ui/Avatar";
import { useCallStore } from "../../store/callStore";
import { acceptCall, hangUp, rejectCall } from "../../lib/callSession";

function useElapsed(connectedAt: number | null) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!connectedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => setElapsed(Math.floor((Date.now() - connectedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [connectedAt]);

  return elapsed;
}

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function CallOverlay() {
  const phase = useCallStore((s) => s.phase);
  const peer = useCallStore((s) => s.peer);
  const type = useCallStore((s) => s.type);
  const muted = useCallStore((s) => s.muted);
  const cameraOff = useCallStore((s) => s.cameraOff);
  const localStream = useCallStore((s) => s.localStream);
  const remoteStream = useCallStore((s) => s.remoteStream);
  const connectedAt = useCallStore((s) => s.connectedAt);
  const statusMessage = useCallStore((s) => s.statusMessage);
  const toggleMuted = useCallStore((s) => s.toggleMuted);
  const toggleCamera = useCallStore((s) => s.toggleCamera);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const elapsed = useElapsed(connectedAt);

  useEffect(() => {
    if (localVideoRef.current) localVideoRef.current.srcObject = localStream;
  }, [localStream, phase]);

  useEffect(() => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
  }, [remoteStream, phase]);

  if (phase === "idle" || !peer) return null;

  const showVideo = type === "video";
  const isJoined = phase === "connecting" || phase === "active";

  return createPortal(
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-gray-950/95 px-6 py-10 text-white">
      <audio ref={remoteAudioRef} autoPlay hidden={showVideo} />

      {showVideo && isJoined ? (
        <div className="relative flex h-full w-full flex-1 items-center justify-center overflow-hidden rounded-[3px] bg-black">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-contain"
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 h-32 w-24 rounded-[3px] border border-white/20 object-cover"
          />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <Avatar src={peer.avatar} name={peer.name} size="xl" />
          <div className="text-center">
            <p className="text-lg font-semibold">{peer.name}</p>
            <p className="text-sm text-gray-300">
              {phase === "incoming" && `Incoming ${type} call`}
              {phase === "outgoing" && "Calling…"}
              {phase === "connecting" && (statusMessage ?? "Connecting…")}
              {phase === "active" && (statusMessage ?? formatDuration(elapsed))}
            </p>
          </div>
          {showVideo && <video ref={localVideoRef} autoPlay playsInline muted hidden />}
          {showVideo && <video ref={remoteVideoRef} autoPlay playsInline hidden />}
        </div>
      )}

      <div className="flex items-center gap-4 pt-6">
        {phase === "incoming" ? (
          <>
            <button
              type="button"
              onClick={rejectCall}
              aria-label="Decline"
              className="flex size-14 items-center justify-center rounded-full bg-danger-600 hover:bg-danger-700"
            >
              <PhoneOff className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => void acceptCall()}
              aria-label="Accept"
              className="flex size-14 items-center justify-center rounded-full bg-success-500 hover:bg-success-600"
            >
              <Phone className="size-6" />
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={toggleMuted}
              aria-label={muted ? "Unmute" : "Mute"}
              className={clsx(
                "flex size-12 items-center justify-center rounded-full",
                muted ? "bg-white text-gray-900" : "bg-white/10 hover:bg-white/20",
              )}
            >
              {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
            </button>
            {showVideo && (
              <button
                type="button"
                onClick={toggleCamera}
                aria-label={cameraOff ? "Turn camera on" : "Turn camera off"}
                className={clsx(
                  "flex size-12 items-center justify-center rounded-full",
                  cameraOff ? "bg-white text-gray-900" : "bg-white/10 hover:bg-white/20",
                )}
              >
                {cameraOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
              </button>
            )}
            <button
              type="button"
              onClick={hangUp}
              aria-label="Hang up"
              className="flex size-14 items-center justify-center rounded-full bg-danger-600 hover:bg-danger-700"
            >
              <PhoneOff className="size-6" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
