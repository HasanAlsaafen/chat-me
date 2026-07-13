import { type ReactNode, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface Props {
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}

export function MessageContextMenu({ x, y, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("scroll", onClose, true);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("scroll", onClose, true);
    };
  }, [onClose]);

  const flipX = x > window.innerWidth - 200;
  const flipY = y > window.innerHeight - 240;

  return createPortal(
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: flipY ? undefined : y,
        bottom: flipY ? window.innerHeight - y : undefined,
        left: flipX ? undefined : x,
        right: flipX ? window.innerWidth - x : undefined,
      }}
      className="z-50 min-w-[11rem] rounded-[3px] border border-neutral-30 bg-white py-1 shadow-[var(--shadow-overlay)] dark:border-gray-800 dark:bg-gray-900"
    >
      {children}
    </div>,
    document.body,
  );
}
