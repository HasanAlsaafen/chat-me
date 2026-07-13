import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Spinner } from "../../components/ui/Spinner";
import { useChatStore } from "../../store/chatStore";
import { messagesApi } from "../../api/messages";
import { getApiErrorMessage } from "../../api/client";
import { getSocket } from "../../lib/socket";
import { getId } from "../../utils/id";
import type { Conversation, Message } from "../../types";

const EMPTY_MESSAGES: Message[] = [];

interface Props {
  conversation: Conversation;
  currentUserId: string;
  onReply: (message: Message) => void;
}

export function MessageList({ conversation, currentUserId, onReply }: Props) {
  const conversationId = getId(conversation);
  const messages =
    useChatStore((s) => s.messagesByConversation[conversationId]) ??
    EMPTY_MESSAGES;
  const loadMessages = useChatStore((s) => s.loadMessages);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const readSentRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    readSentRef.current = new Set();
    setLoadingHistory(true);
    messagesApi
      .list(conversationId)
      .then((history) => loadMessages(conversationId, history))
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoadingHistory(false));
  }, [conversationId, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    for (const message of messages) {
      const senderId = getId(message.sender);
      if (senderId === currentUserId) continue;
      const messageId = getId(message);
      if (readSentRef.current.has(messageId)) continue;
      const alreadyRead = message.receipts.some(
        (r) => r.user === currentUserId && r.status === "read",
      );
      if (alreadyRead) continue;
      readSentRef.current.add(messageId);
      socket.emit("mark_read", { messageId, conversationId });
    }
  }, [messages, currentUserId, conversationId]);

  return (
    <div className="chat-wallpaper flex-1 overflow-y-auto px-4 py-4">
      {loadingHistory && (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      )}

      {!loadingHistory && messages.length === 0 && (
        <div className="flex flex-1 items-center justify-center py-12 text-sm text-neutral-100">
          No messages yet. Say hello!
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {messages.map((message, index) => {
          const previous = messages[index - 1];
          const showSenderInfo =
            !previous || getId(previous.sender) !== getId(message.sender);
          return (
            <MessageBubble
              key={getId(message)}
              message={message}
              conversation={conversation}
              currentUserId={currentUserId}
              showSenderInfo={showSenderInfo}
              onReply={onReply}
            />
          );
        })}
      </div>
      <TypingIndicator conversation={conversation} currentUserId={currentUserId} />
      <div ref={bottomRef} />
    </div>
  );
}
