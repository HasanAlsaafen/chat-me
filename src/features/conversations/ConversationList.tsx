import { useMemo } from "react";
import { ConversationListItem } from "./ConversationListItem";
import { useChatStore } from "../../store/chatStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useAuthStore } from "../../store/authStore";
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
      [...conversations].sort(
        (a, b) =>
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime(),
      ),
    [conversations],
  );

  if (!currentUser) return null;

  const list = isSearching ? (searchResults ?? []) : sorted;

  if (isSearching && searching) {
    return (
      <div className="flex flex-1 items-center justify-center py-12 text-sm text-neutral-100">
        Searching…
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center text-sm text-neutral-100">
        {isSearching
          ? "No groups found."
          : "No conversations yet. Start one with the + button above."}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-2">
      {list.map((conversation) => (
        <ConversationListItem
          key={getId(conversation)}
          conversation={conversation}
          currentUserId={getId(currentUser)}
          unreadCount={unreadByConversation.get(getId(conversation)) ?? 0}
        />
      ))}
    </div>
  );
}
