import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatHeader } from "./ChatHeader";
import { PinnedMessagesBar } from "./PinnedMessagesBar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { FullPageSpinner } from "../../components/ui/Spinner";
import toast from "react-hot-toast";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useBlockedUsersStore } from "../../store/blockedUsersStore";
import { notificationsApi } from "../../api/notifications";
import { usersApi } from "../../api/users";
import { getApiErrorMessage } from "../../api/client";
import { getSocket } from "../../lib/socket";
import { getId } from "../../utils/id";
import { otherMember } from "../../utils/conversation";
import type { Message } from "../../types";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const conversations = useChatStore((s) => s.conversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const currentUser = useAuthStore((s) => s.user);
  const markConversationAsRead = useNotificationStore(
    (s) => s.markConversationAsRead,
  );
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const conversation = conversations.find((c) => getId(c) === conversationId);
  const peer =
    conversation?.type === "direct" && currentUser
      ? otherMember(conversation, getId(currentUser))
      : undefined;
  const peerId = peer ? getId(peer) : undefined;
  const isBlocked = useBlockedUsersStore((s) => (peerId ? s.ids.has(peerId) : false));
  const unblockUserInStore = useBlockedUsersStore((s) => s.unblock);
  const [unblocking, setUnblocking] = useState(false);

  const unblock = async () => {
    if (!peerId) return;
    setUnblocking(true);
    try {
      await usersApi.unblock(peerId);
      unblockUserInStore(peerId);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setUnblocking(false);
    }
  };

  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    setReplyTo(null);
    if (!conversationId) return;
    const socket = getSocket();
    socket?.emit("join_conversation", { conversationId });

    const cleared = markConversationAsRead(conversationId);
    const toSync = cleared.filter((n) => !getId(n).startsWith("live-"));
    if (toSync.length > 0) {
      Promise.all(
        toSync.map((n) => notificationsApi.markAsRead(getId(n))),
      ).catch(() => {
        // best-effort
      });
    }

    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation, markConversationAsRead]);

  if (!currentUser) return null;

  if (!conversation) {
    if (conversations.length === 0) return <FullPageSpinner />;
    return (
      <div className="flex h-full flex-1 items-center justify-center text-sm text-gray-400">
        Conversation not found.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col">
      <ChatHeader
        conversation={conversation}
        currentUserId={getId(currentUser)}
      />
      <PinnedMessagesBar conversation={conversation} />
      <MessageList
        conversation={conversation}
        currentUserId={getId(currentUser)}
        onReply={setReplyTo}
      />
      {isBlocked ? (
        <div className="flex items-center justify-between gap-3 border-t border-neutral-30 bg-white px-4 py-3 text-sm dark:border-gray-800 dark:bg-gray-950">
          <span className="text-neutral-300 dark:text-gray-400">
            You blocked this contact.
          </span>
          <button
            type="button"
            onClick={() => void unblock()}
            disabled={unblocking}
            className="font-medium text-brand-600 hover:underline disabled:opacity-50"
          >
            Unblock
          </button>
        </div>
      ) : (
        <MessageInput
          conversationId={getId(conversation)}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      )}
    </div>
  );
}
