import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, X } from "lucide-react";

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <a
          href={src}
          download
          onClick={(e) => e.stopPropagation()}
          className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Download image"
        >
          <Download className="size-5" />
        </a>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>
      <img
        src={src}
        alt={alt ?? "Shared image"}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] rounded-[6px] object-contain"
      />
    </div>,
    document.body,
  );
}
