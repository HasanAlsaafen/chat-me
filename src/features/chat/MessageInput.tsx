import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Image as ImageIcon,
  Mic,
  Paperclip,
  Send,
  Square,
  X,
} from "lucide-react";
import clsx from "clsx";
import { getSocket } from "../../lib/socket";
import { uploadApi } from "../../api/upload";
import { useVoiceRecorder } from "../../hooks/useVoiceRecorder";
import { getApiErrorMessage } from "../../api/client";
import { getId } from "../../utils/id";
import type { Message } from "../../types";

interface Props {
  conversationId: string;
  replyTo: Message | null;
  onCancelReply: () => void;
}

export function MessageInput({
  conversationId,
  replyTo,
  onCancelReply,
}: Props) {
  const [text, setText] = useState("");
  const [uploading, setUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recorder = useVoiceRecorder();
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const stopTyping = () => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    getSocket()?.emit("stop_typing", { conversationId });
  };

  useEffect(() => {
    return () => stopTyping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  const handleTextChange = (value: string) => {
    setText(value);
    const socket = getSocket();
    if (!socket?.connected) return;
    if (!value.trim()) {
      stopTyping();
      return;
    }
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit("typing", { conversationId });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(stopTyping, 2000);
  };

  const send = (content: string, type: Message["type"]): boolean => {
    const socket = getSocket();
    if (!socket?.connected) {
      toast.error("Not connected. Please refresh the page.");
      return false;
    }
    socket.emit("send_message", {
      conversationId,
      content,
      type,
      replyTo: replyTo ? getId(replyTo) : undefined,
    });
    onCancelReply();
    return true;
  };

  const sendText = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    stopTyping();
    if (send(trimmed, "text")) setText("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadApi.image(file);
      send(result.url, "image");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadApi.file(file);
      send(result.url, file.type.startsWith("audio/") ? "audio" : "file");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleMicClick = async () => {
    if (recorder.recording) {
      const file = await recorder.stop();
      if (!file) return;
      setUploading(true);
      try {
        const result = await uploadApi.file(file);
        send(result.url, "audio");
      } catch (err) {
        toast.error(getApiErrorMessage(err));
      } finally {
        setUploading(false);
      }
    } else {
      try {
        await recorder.start();
      } catch {
        toast.error("Microphone access was denied.");
      }
    }
  };

  return (
    <div className="border-t border-neutral-30 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      {replyTo && (
        <div className="mb-2 flex items-center justify-between rounded-[3px] bg-neutral-20 px-3 py-1.5 text-xs text-neutral-600 dark:bg-gray-800 dark:text-gray-300">
          <span className="truncate">
            Replying to:{" "}
            {replyTo.type === "text"
              ? replyTo.content
              : `${replyTo.type} attachment`}
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleImagePick(e)}
        />
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => void handleFilePick(e)}
        />

        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={uploading || recorder.recording}
          className="rounded-[3px] p-2 text-neutral-100 hover:bg-neutral-20 disabled:opacity-50 dark:hover:bg-gray-800"
          aria-label="Attach image"
        >
          <ImageIcon className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || recorder.recording}
          className="rounded-[3px] p-2 text-neutral-100 hover:bg-neutral-20 disabled:opacity-50 dark:hover:bg-gray-800"
          aria-label="Attach file"
        >
          <Paperclip className="size-5" />
        </button>

        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={recorder.recording}
          placeholder={
            recorder.recording ? "Recording voice message…" : "Type a message…"
          }
          rows={1}
          className="max-h-32 flex-1 resize-none rounded-[3px] border border-neutral-40 bg-neutral-10 px-4 py-2 text-sm text-neutral-800 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-neutral-20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        />

        <button
          type="button"
          onClick={() => void handleMicClick()}
          disabled={uploading}
          className={clsx(
            "rounded-[3px] p-2 disabled:opacity-50",
            recorder.recording
              ? "bg-danger-600 text-white hover:bg-danger-400"
              : "text-neutral-100 hover:bg-neutral-20 dark:hover:bg-gray-800",
          )}
          aria-label={
            recorder.recording ? "Stop recording" : "Record voice message"
          }
        >
          {recorder.recording ? (
            <Square className="size-5" />
          ) : (
            <Mic className="size-5" />
          )}
        </button>

        {text.trim() && (
          <button
            type="button"
            onClick={sendText}
            className="rounded-[3px] bg-brand-600 p-2 text-white hover:bg-brand-500"
            aria-label="Send message"
          >
            <Send className="size-5" />
          </button>
        )}
      </div>
    </div>
  );
}
