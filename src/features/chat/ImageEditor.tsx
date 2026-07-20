import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Type, Undo2, Trash2, X, Check } from "lucide-react";
import clsx from "clsx";
import { Button } from "../../components/ui/Button";

const COLORS = ["#FF3B30", "#FFCC00", "#34C759", "#0A84FF", "#FFFFFF", "#000000"];

type Tool = "draw" | "text";

type Stroke = {
  kind: "stroke";
  color: string;
  points: { x: number; y: number }[];
};

type TextItem = {
  kind: "text";
  color: string;
  x: number;
  y: number;
  value: string;
};

type Layer = Stroke | TextItem;

interface Props {
  file: File;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

export function ImageEditor({ file, onCancel, onConfirm }: Props) {
  const [imageUrl] = useState(() => URL.createObjectURL(file));
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>("draw");
  const [color, setColor] = useState(COLORS[0]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const drawingRef = useRef<Stroke | null>(null);
  const [pendingText, setPendingText] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [textDraft, setTextDraft] = useState("");

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = imageUrl;
    return () => URL.revokeObjectURL(imageUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const render = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgEl, 0, 0, canvas.width, canvas.height);
    for (const layer of layers) {
      if (layer.kind === "stroke") {
        if (layer.points.length < 2) continue;
        ctx.strokeStyle = layer.color;
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(layer.points[0].x, layer.points[0].y);
        for (const p of layer.points.slice(1)) ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.fillStyle = layer.color;
        ctx.font = "bold 28px sans-serif";
        ctx.textBaseline = "top";
        ctx.fillText(layer.value, layer.x, layer.y);
      }
    }
  };

  useEffect(() => {
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgEl, layers]);

  useEffect(() => {
    if (!imgEl || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const maxW = Math.min(imgEl.width, window.innerWidth * 0.85);
    const scale = maxW / imgEl.width;
    canvas.width = imgEl.width * scale;
    canvas.height = imgEl.height * scale;
    render();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imgEl]);

  const pointFromEvent = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    // The canvas's internal pixel buffer (canvas.width/height) can differ
    // from its rendered CSS size once max-h-full/max-w-full shrink it to
    // fit the viewport, so scale pointer coordinates into buffer space.
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(e);
    if (tool === "text") {
      setPendingText(point);
      setTextDraft("");
      return;
    }
    const stroke: Stroke = { kind: "stroke", color, points: [point] };
    drawingRef.current = stroke;
    setLayers((prev) => [...prev, stroke]);
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const point = pointFromEvent(e);
    drawingRef.current.points.push(point);
    setLayers((prev) => [...prev]);
  };

  const onPointerUp = () => {
    drawingRef.current = null;
  };

  const commitText = () => {
    if (pendingText && textDraft.trim()) {
      setLayers((prev) => [
        ...prev,
        { kind: "text", color, x: pendingText.x, y: pendingText.y, value: textDraft },
      ]);
    }
    setPendingText(null);
    setTextDraft("");
  };

  const undo = () => setLayers((prev) => prev.slice(0, -1));
  const clearAll = () => setLayers([]);

  const confirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const edited = new File([blob], file.name, {
        type: "image/png",
      });
      onConfirm(edited);
    }, "image/png");
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white"
          aria-label="Cancel"
        >
          <X className="size-5" />
        </button>
        <div className="flex items-center gap-1 rounded-full bg-white/10 p-1">
          <button
            type="button"
            onClick={() => setTool("draw")}
            className={clsx(
              "rounded-full p-2 text-white/80 hover:text-white",
              tool === "draw" && "bg-white/20 text-white",
            )}
            aria-label="Draw"
          >
            <Pencil className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setTool("text")}
            className={clsx(
              "rounded-full p-2 text-white/80 hover:text-white",
              tool === "text" && "bg-white/20 text-white",
            )}
            aria-label="Add text"
          >
            <Type className="size-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={undo}
            disabled={layers.length === 0}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Undo"
          >
            <Undo2 className="size-5" />
          </button>
          <button
            type="button"
            onClick={clearAll}
            disabled={layers.length === 0}
            className="rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-30"
            aria-label="Clear all"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden px-4">
        <div className="relative inline-block">
          <canvas
            ref={canvasRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className="max-h-full max-w-full touch-none rounded-[6px]"
            style={{ cursor: tool === "text" ? "text" : "crosshair" }}
          />
          {pendingText && (
            <input
              autoFocus
              value={textDraft}
              onChange={(e) => setTextDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitText();
                if (e.key === "Escape") {
                  setPendingText(null);
                  setTextDraft("");
                }
              }}
              onBlur={commitText}
              style={{
                position: "absolute",
                left: pendingText.x,
                top: pendingText.y,
                color,
              }}
              className="min-w-[4rem] border-b-2 border-dashed border-current bg-transparent text-2xl font-bold outline-none"
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              className={clsx(
                "size-7 rounded-full ring-2 ring-offset-2 ring-offset-black",
                color === c ? "ring-white" : "ring-transparent",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <Button variant="primary" onClick={confirm} className="gap-2">
          <Check className="size-4" /> Send
        </Button>
      </div>
    </div>,
    document.body,
  );
}
