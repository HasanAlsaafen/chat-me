import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ChatHeader } from "./ChatHeader";
import { PinnedMessagesBar } from "./PinnedMessagesBar";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { FullPageSpinner } from "../../components/ui/Spinner";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { getSocket } from "../../lib/socket";
import { getId } from "../../utils/id";
import type { Message } from "../../types";

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const conversations = useChatStore((s) => s.conversations);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const currentUser = useAuthStore((s) => s.user);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  const conversation = conversations.find((c) => getId(c) === conversationId);

  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    setReplyTo(null);
    if (!conversationId) return;
    const socket = getSocket();
    socket?.emit("join_conversation", { conversationId });
    return () => setActiveConversation(null);
  }, [conversationId, setActiveConversation]);

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
      <MessageInput
        conversationId={getId(conversation)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
}
