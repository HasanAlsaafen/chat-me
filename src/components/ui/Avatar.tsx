import { useEffect, useState } from "react";
import clsx from "clsx";

interface AvatarProps {
  src?: string;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-24 text-2xl",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const palette = [
  "bg-[#0052CC]",
  "bg-[#00875A]",
  "bg-[#FF991F]",
  "bg-[#DE350B]",
  "bg-[#6554C0]",
  "bg-[#00A3BF]",
  "bg-[#403294]",
  "bg-[#5243AA]",
  "bg-[#008DA6]",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

export function Avatar({
  src,
  name,
  size = "md",
  online,
  className,
}: AvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const showImage = Boolean(src) && !imgFailed;

  return (
    <div className={clsx("relative shrink-0", className)}>
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgFailed(true)}
          className={clsx("rounded-full object-cover", sizeClasses[size])}
        />
      ) : (
        <div
          className={clsx(
            "flex items-center justify-center rounded-full font-semibold text-white",
            colorFor(name || "?"),
            sizeClasses[size],
          )}
        >
          {initials(name || "?")}
        </div>
      )}
      {online !== undefined && (
        <span
          className={clsx(
            "absolute bottom-0 right-0 size-2.5 rounded-full ring-2 ring-white dark:ring-gray-900",
            online ? "bg-success-400" : "bg-neutral-60",
          )}
        />
      )}
    </div>
  );
}
