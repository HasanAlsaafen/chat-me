import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Spinner } from "../../components/ui/Spinner";
import { useChatStore } from "../../store/chatStore";
import { useLocalPrefsStore } from "../../store/localPrefsStore";
import { messagesApi } from "../../api/messages";
import { getApiErrorMessage } from "../../api/client";
import { getSocket } from "../../lib/socket";
import { getId } from "../../utils/id";
import type { Conversation, Message } from "../../types";

const EMPTY_MESSAGES: Message[] = [];
const PAGE_SIZE = 60;

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
  const setLastRead = useLocalPrefsStore((s) => s.setLastRead);
  const lastReadByConversation = useLocalPrefsStore(
    (s) => s.lastReadByConversation,
  );
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const readSentRef = useRef<Set<string>>(new Set());
  const dividerAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    dividerAnchorRef.current = lastReadByConversation[conversationId] ?? null;
    setVisibleCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    readSentRef.current = new Set();
    setLoadingHistory(true);
    messagesApi
      .list(conversationId)
      .then((history) => loadMessages(conversationId, history))
      .catch((err) => toast.error(getApiErrorMessage(err)))
      .finally(() => setLoadingHistory(false));
  }, [conversationId, loadMessages]);

  const markRead = () => {
    const last = messages[messages.length - 1];
    if (last) setLastRead(conversationId, getId(last));
  };

  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      markRead();
    } else {
      updateScrollButtonVisibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    return () => markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  function updateScrollButtonVisibility() {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    const wasNearBottom = isNearBottomRef.current;
    isNearBottomRef.current = nearBottom;
    setShowScrollButton(!nearBottom && el.scrollHeight > el.clientHeight);
    if (nearBottom && !wasNearBottom) markRead();
    if (el.scrollTop < 200 && visibleCount < messages.length) {
      setVisibleCount((c) => Math.min(messages.length, c + PAGE_SIZE));
    }
  }

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  const visibleMessages = messages.slice(-visibleCount);
  const hasMoreHistory = visibleCount < messages.length;

  const firstUnreadIndex = dividerAnchorRef.current
    ? messages.findIndex((m) => getId(m) === dividerAnchorRef.current) + 1
    : -1;

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        onScroll={updateScrollButtonVisibility}
        className="chat-wallpaper h-full overflow-y-auto px-4 py-4"
      >
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

        {hasMoreHistory && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((c) => Math.min(messages.length, c + PAGE_SIZE))
              }
              className="rounded-full border border-neutral-30 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-20 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Load earlier messages
            </button>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          {visibleMessages.map((message, i) => {
            const index = messages.length - visibleMessages.length + i;
            const previous = messages[index - 1];
            const showSenderInfo =
              !previous || getId(previous.sender) !== getId(message.sender);
            return (
              <div key={getId(message)}>
                {firstUnreadIndex > 0 &&
                  firstUnreadIndex < messages.length &&
                  index === firstUnreadIndex && (
                    <div className="my-3 flex items-center gap-3 text-xs font-medium text-danger-600 dark:text-danger-400">
                      <div className="h-px flex-1 bg-danger-200 dark:bg-danger-900" />
                      New messages
                      <div className="h-px flex-1 bg-danger-200 dark:bg-danger-900" />
                    </div>
                  )}
                <MessageBubble
                  message={message}
                  conversation={conversation}
                  currentUserId={currentUserId}
                  showSenderInfo={showSenderInfo}
                  onReply={onReply}
                />
              </div>
            );
          })}
        </div>
        <TypingIndicator conversation={conversation} currentUserId={currentUserId} />
        <div ref={bottomRef} />
      </div>
      {showScrollButton && (
        <button
          type="button"
          onClick={scrollToBottom}
          aria-label="Scroll to latest messages"
          className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full border border-neutral-30 bg-white text-neutral-700 shadow-[0_4px_10px_rgba(9,30,66,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-neutral-10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <ChevronDown className="size-5" />
        </button>
      )}
    </div>
  );
}
