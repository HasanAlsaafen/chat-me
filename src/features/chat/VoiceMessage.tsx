import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Pause, Play } from "lucide-react";

const BAR_COUNT = 27;

function barHeights(seed: string): number[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const heights: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    heights.push(25 + (h % 75));
  }
  return heights;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceMessage({
  src,
  isOwn,
}: {
  src: string;
  isOwn: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const bars = useMemo(() => barHeights(src), [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnd = () => {
      setPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      void audio.play();
      setPlaying(true);
    }
  };

  const progress = duration ? currentTime / duration : 0;
  const activeBars = Math.round(progress * BAR_COUNT);
  const timeLabel = formatTime(playing || currentTime > 0 ? currentTime : duration);

  return (
    <div className="flex w-[220px] items-center gap-2 py-0.5">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
        className={clsx(
          "flex size-8 shrink-0 items-center justify-center rounded-full",
          isOwn ? "bg-white text-brand-600" : "bg-brand-600 text-white",
        )}
      >
        {playing ? (
          <Pause className="size-4 fill-current" />
        ) : (
          <Play className="ml-0.5 size-4 fill-current" />
        )}
      </button>
      <div className="flex h-7 flex-1 items-center gap-[2px]">
        {bars.map((height, i) => (
          <span
            key={i}
            className={clsx(
              "w-[3px] shrink-0 rounded-full transition-opacity",
              isOwn ? "bg-white" : "bg-brand-600",
              i < activeBars ? "opacity-100" : "opacity-35",
            )}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <span
        className={clsx(
          "shrink-0 text-[10px] tabular-nums",
          isOwn ? "text-white/80" : "text-neutral-300",
        )}
      >
        {timeLabel}
      </span>
      <audio ref={audioRef} src={src} className="hidden" preload="metadata" />
    </div>
  );
}
