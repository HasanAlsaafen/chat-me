import { type ReactNode, useEffect, useRef, useState } from "react";
import clsx from "clsx";

interface DropdownProps {
  trigger: (opts: { open: boolean; toggle: () => void }) => ReactNode;
  children: (opts: { close: () => void }) => ReactNode;
  align?: "left" | "right";
  panelClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  panelClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle: () => setOpen((o) => !o) })}
      {open && (
        <div
          className={clsx(
            "absolute z-40 mt-2 min-w-[12rem] rounded-[3px] border border-neutral-30 bg-white py-1 shadow-[var(--shadow-overlay)] dark:border-gray-800 dark:bg-gray-900",
            align === "right" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      )}
    </div>
  );
}
