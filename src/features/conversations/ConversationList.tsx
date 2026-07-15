import { useMemo, useState } from "react";
import { Archive } from "lucide-react";
import { ConversationListItem } from "./ConversationListItem";
import { useChatStore } from "../../store/chatStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useAuthStore } from "../../store/authStore";
import { useLocalPrefsStore } from "../../store/localPrefsStore";
import { useConversationSearch } from "../../hooks/useConversationSearch";
import { getId } from "../../utils/id";
import type { NewMessageNotificationPayload } from "../../types";

export function ConversationList({
  searchTerm = "",
}: {
  searchTerm?: string;
}) {
  const conversations = useChatStore((s) => s.conversations);
  const unread = useNotificationStore((s) => s.unread);
  const currentUser = useAuthStore((s) => s.user);
  const conversationFlags = useLocalPrefsStore((s) => s.conversationFlags);
  const [showArchived, setShowArchived] = useState(false);
  const isSearching = searchTerm.trim().length >= 2;
  const { data: searchResults, isFetching: searching } =
    useConversationSearch(searchTerm);

  const unreadByConversation = useMemo(() => {
    const map = new Map<string, number>();
    for (const n of unread) {
      if (n.type !== "new_message") continue;
      const conversationId = (n.payload as NewMessageNotificationPayload)
        .conversationId;
      if (!conversationId) continue;
      map.set(conversationId, (map.get(conversationId) ?? 0) + 1);
    }
    return map;
  }, [unread]);

  const sorted = useMemo(
    () =>
      [...conversations].sort((a, b) => {
        const aPinned = conversationFlags[getId(a)]?.pinned ? 1 : 0;
        const bPinned = conversationFlags[getId(b)]?.pinned ? 1 : 0;
        if (aPinned !== bPinned) return bPinned - aPinned;
        return (
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime()
        );
      }),
    [conversations, conversationFlags],
  );

  if (!currentUser) return null;

  const base = isSearching ? (searchResults ?? []) : sorted;
  const archivedCount = isSearching
    ? 0
    : sorted.filter((c) => conversationFlags[getId(c)]?.archived).length;
  const list = isSearching
    ? base
    : base.filter((c) =>
        showArchived
          ? Boolean(conversationFlags[getId(c)]?.archived)
          : !conversationFlags[getId(c)]?.archived,
      );

  if (isSearching && searching) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-neutral-100">
        Searching…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {!isSearching && archivedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="mx-2 mt-1 flex items-center gap-2 rounded-[3px] px-2 py-2 text-left text-xs font-medium text-neutral-300 hover:bg-neutral-20 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <Archive className="size-3.5" />
          {showArchived
            ? "Hide archived"
            : `Archived (${archivedCount})`}
        </button>
      )}
      <div className="flex flex-1 flex-col gap-1 px-2 py-2">
        {list.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-neutral-100">
            {isSearching
              ? "No groups found."
              : showArchived
                ? "No archived conversations."
                : "No conversations yet. Start one with the + button above."}
          </div>
        )}
        {list.map((conversation) => (
          <ConversationListItem
            key={getId(conversation)}
            conversation={conversation}
            currentUserId={getId(currentUser)}
            unreadCount={unreadByConversation.get(getId(conversation)) ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
