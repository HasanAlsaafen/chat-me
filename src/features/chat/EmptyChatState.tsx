import { MessageCircle } from "lucide-react";

export function EmptyChatState() {
  return (
    <div className="chat-wallpaper hidden h-full flex-1 flex-col items-center justify-center gap-3 text-neutral-300 md:flex dark:text-gray-400">
      <div className="flex size-16 items-center justify-center rounded-full bg-white shadow-[var(--shadow-raised)] dark:bg-gray-800">
        <MessageCircle className="size-7" />
      </div>
      <p className="text-sm">Select a conversation or start a new one</p>
    </div>
  );
}
