import { Pin, X } from "lucide-react";
import { useChatStore } from "../../store/chatStore";
import { useLocalPrefsStore } from "../../store/localPrefsStore";
import { getId } from "../../utils/id";
import type { Conversation } from "../../types";

const EMPTY_PINNED_IDS: string[] = [];

export function PinnedMessagesBar({
  conversation,
}: {
  conversation: Conversation;
}) {
  const conversationId = getId(conversation);
  const pinnedIds = useLocalPrefsStore(
    (s) => s.pinnedMessagesByConversation[conversationId] ?? EMPTY_PINNED_IDS,
  );
  const togglePinnedMessage = useLocalPrefsStore(
    (s) => s.togglePinnedMessage,
  );
  const messages =
    useChatStore((s) => s.messagesByConversation[conversationId]) ?? [];

  if (pinnedIds.length === 0) return null;

  const pinned = pinnedIds
    .map((id) => messages.find((m) => getId(m) === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  if (pinned.length === 0) return null;

  const jumpTo = (id: string) => {
    document
      .getElementById(`message-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-neutral-30 bg-brand-50 px-4 py-1.5 dark:border-gray-800 dark:bg-brand-900/20">
      {pinned.map((message) => {
        const messageId = getId(message);
        return (
          <div
            key={messageId}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-brand-200 bg-white px-2.5 py-1 text-xs text-neutral-700 dark:border-brand-800 dark:bg-gray-900 dark:text-gray-200"
          >
            <Pin className="size-3 shrink-0 text-brand-600" />
            <button
              type="button"
              onClick={() => jumpTo(messageId)}
              className="max-w-[10rem] truncate text-left hover:underline"
            >
              {message.type === "text"
                ? message.content
                : `${message.type} attachment`}
            </button>
            <button
              type="button"
              onClick={() => togglePinnedMessage(conversationId, messageId)}
              aria-label="Unpin message"
              className="text-neutral-100 hover:text-danger-600"
            >
              <X className="size-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
