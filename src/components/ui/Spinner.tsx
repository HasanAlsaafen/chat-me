import clsx from "clsx";
import { Loader2 } from "lucide-react";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={clsx("size-5 animate-spin text-brand-500", className)}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
