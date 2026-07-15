import { useState } from "react";
import clsx from "clsx";
import {
  Check,
  CheckCheck,
  Download,
  Pencil,
  Pin,
  PinOff,
  Reply,
  FileText,
  Trash2,
} from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { VoiceMessage } from "./VoiceMessage";
import { MessageContextMenu } from "./MessageContextMenu";
import type { Conversation, Message } from "../../types";
import { getId } from "../../utils/id";
import { formatMessageTime } from "../../utils/date";
import { aggregateStatus } from "../../utils/messageStatus";
import { renderRichText } from "../../utils/richText";
import { useChatStore } from "../../store/chatStore";
import { useLocalPrefsStore } from "../../store/localPrefsStore";
import { getSocket } from "../../lib/socket";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

interface Props {
  message: Message;
  conversation: Conversation;
  currentUserId: string;
  showSenderInfo: boolean;
  onReply: (message: Message) => void;
}

function resolveUser(sender: Message["sender"], conversation: Conversation) {
  if (typeof sender !== "string") return sender;
  const found = conversation.members.find(
    (m) => typeof m !== "string" && getId(m) === sender,
  );
  return typeof found === "object"
    ? found
    : { id: sender, displayName: "Unknown", email: "", avatar: undefined };
}

function ReplyPreview({
  replyTo,
  conversationId,
}: {
  replyTo: Message["replyTo"];
  conversationId: string;
}) {
  const messages = useChatStore(
    (s) => s.messagesByConversation[conversationId],
  );
  if (!replyTo) return null;
  const replyId = getId(replyTo);
  const resolved =
    typeof replyTo === "string"
      ? messages?.find((m) => getId(m) === replyId)
      : replyTo;
  if (!resolved) return null;
  return (
    <div className="mb-1 truncate rounded-[3px] border-l-2 border-brand-400 bg-black/5 px-2 py-1 text-xs text-neutral-600 dark:bg-white/10 dark:text-gray-300">
      {resolved.type === "text"
        ? resolved.content
        : `${resolved.type} attachment`}
    </div>
  );
}

function MessageContent({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  if (message.isDeleted) {
    return <p className="italic text-neutral-100">This message was deleted</p>;
  }
  switch (message.type) {
    case "image":
      return (
        <a href={message.content} target="_blank" rel="noreferrer">
          <img
            src={message.content}
            alt="Shared"
            className="max-h-64 max-w-xs rounded-[6px] object-cover"
          />
        </a>
      );
    case "audio":
      return <VoiceMessage src={message.content} isOwn={isOwn} />;
    case "file":
      return (
        <a
          href={message.content}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-[3px] bg-black/5 px-3 py-2 text-sm underline dark:bg-white/10"
        >
          <FileText className="size-4 shrink-0" />
          <span className="truncate">Download attachment</span>
          <Download className="size-4 shrink-0" />
        </a>
      );
    default:
      return (
        <p className="whitespace-pre-wrap break-words">
          {renderRichText(message.content)}
        </p>
      );
  }
}

function ReactionBar({
  message,
  conversationId,
  currentUserId,
}: {
  message: Message;
  conversationId: string;
  currentUserId: string;
}) {
  const setReaction = useChatStore((s) => s.setReaction);
  const removeReaction = useChatStore((s) => s.removeReaction);

  if (message.reactions.length === 0) return null;

  const counts = new Map<string, number>();
  for (const r of message.reactions) {
    counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
  }
  const ownEmoji = message.reactions.find(
    (r) => r.user === currentUserId,
  )?.emoji;

  const toggle = (emoji: string) => {
    const socket = getSocket();
    if (!socket?.connected) return;
    const messageId = getId(message);
    if (ownEmoji === emoji) {
      removeReaction(conversationId, messageId, currentUserId);
      socket.emit("remove_reaction", { messageId, conversationId });
    } else {
      setReaction(conversationId, messageId, currentUserId, emoji);
      socket.emit("add_reaction", { messageId, conversationId, emoji });
    }
  };

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {[...counts.entries()].map(([emoji, count]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => toggle(emoji)}
          className={clsx(
            "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs",
            ownEmoji === emoji
              ? "border-brand-500 bg-brand-50 dark:bg-brand-900/40"
              : "border-neutral-30 bg-white dark:border-gray-700 dark:bg-gray-800",
          )}
        >
          <span>{emoji}</span>
          <span className="text-neutral-100">{count}</span>
        </button>
      ))}
    </div>
  );
}

export function MessageBubble({
  message,
  conversation,
  currentUserId,
  showSenderInfo,
  onReply,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const conversationId = getId(conversation);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setReaction = useChatStore((s) => s.setReaction);
  const messageId = getId(message);
  const isPinned = useLocalPrefsStore((s) =>
    (s.pinnedMessagesByConversation[conversationId] ?? []).includes(
      messageId,
    ),
  );
  const togglePinnedMessage = useLocalPrefsStore(
    (s) => s.togglePinnedMessage,
  );

  const senderId = getId(message.sender);
  const isOwn = senderId === currentUserId;
  const sender = resolveUser(message.sender, conversation);

  const otherMemberIds = conversation.members
    .map((m) => getId(m))
    .filter((id) => id !== currentUserId);
  const status = isOwn ? aggregateStatus(message, otherMemberIds) : null;

  const canModify = isOwn && !message.isDeleted && message.type === "text";

  const startEdit = () => {
    setEditValue(message.content);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (!trimmed || trimmed === message.content) {
      setIsEditing(false);
      return;
    }
    const socket = getSocket();
    if (socket?.connected) {
      const messageId = getId(message);
      updateMessage(conversationId, messageId, {
        content: trimmed,
        isEdited: true,
        editedAt: new Date().toISOString(),
      });
      socket.emit("edit_message", { messageId, conversationId, content: trimmed });
    }
    setIsEditing(false);
  };

  const deleteMessage = () => {
    const socket = getSocket();
    if (!socket?.connected) return;
    const messageId = getId(message);
    updateMessage(conversationId, messageId, { isDeleted: true });
    socket.emit("delete_message", { messageId, conversationId });
  };

  const reactWith = (emoji: string) => {
    const socket = getSocket();
    if (!socket?.connected) return;
    const messageId = getId(message);
    setReaction(conversationId, messageId, currentUserId, emoji);
    socket.emit("add_reaction", { messageId, conversationId, emoji });
  };

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      id={`message-${messageId}`}
      className={clsx(
        "group flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      {!isOwn && (
        <div className="w-8">
          {showSenderInfo && (
            <Avatar src={sender.avatar} name={sender.displayName} size="sm" />
          )}
        </div>
      )}
      <div
        className={clsx(
          "flex max-w-[70%] flex-col",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {showSenderInfo && !isOwn && conversation.type === "group" && (
          <span className="mb-0.5 px-1 text-xs font-medium text-neutral-300 dark:text-gray-400">
            {sender.displayName}
          </span>
        )}
        <div className="relative">
          <div
            onContextMenu={openMenu}
            className={clsx(
              "rounded-[8px] text-sm",
              message.type === "image" ? "p-1" : "px-3 py-2",
              isOwn
                ? "rounded-br-[3px] bg-brand-600 text-white"
                : "rounded-bl-[3px] bg-neutral-20 text-neutral-800 dark:bg-gray-800 dark:text-gray-100",
            )}
          >
            {isPinned && (
              <Pin
                className={clsx(
                  "mb-1 size-3",
                  isOwn ? "text-white/80" : "text-brand-600",
                )}
              />
            )}
            <ReplyPreview replyTo={message.replyTo} conversationId={conversationId} />
            {isEditing ? (
              <div className="flex flex-col gap-1.5">
                <textarea
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit();
                    } else if (e.key === "Escape") {
                      setIsEditing(false);
                    }
                  }}
                  rows={1}
                  className="w-full resize-none rounded-[3px] border border-white/30 bg-white/10 px-2 py-1 text-sm text-inherit outline-none focus:border-white/60"
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="underline opacity-80 hover:opacity-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="font-medium underline opacity-80 hover:opacity-100"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <MessageContent message={message} isOwn={isOwn} />
            )}
          </div>

          {menuPos && (
            <MessageContextMenu
              x={menuPos.x}
              y={menuPos.y}
              onClose={() => setMenuPos(null)}
            >
              {!message.isDeleted && (
                <div className="flex justify-center gap-1 border-b border-neutral-30 px-2 py-2 dark:border-gray-800">
                  {QUICK_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        reactWith(emoji);
                        setMenuPos(null);
                      }}
                      className="rounded-full p-1 text-base hover:bg-neutral-20 dark:hover:bg-gray-700"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  onReply(message);
                  setMenuPos(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                <Reply className="size-4" /> Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  togglePinnedMessage(conversationId, messageId);
                  setMenuPos(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
              >
                {isPinned ? (
                  <>
                    <PinOff className="size-4" /> Unpin message
                  </>
                ) : (
                  <>
                    <Pin className="size-4" /> Pin message
                  </>
                )}
              </button>
              {canModify && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      startEdit();
                      setMenuPos(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
                  >
                    <Pencil className="size-4" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteMessage();
                      setMenuPos(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="size-4" /> Delete
                  </button>
                </>
              )}
            </MessageContextMenu>
          )}
        </div>
        <ReactionBar
          message={message}
          conversationId={conversationId}
          currentUserId={currentUserId}
        />
        <div className="mt-0.5 flex items-center gap-1 px-1 text-[11px] text-neutral-100">
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.isEdited && !message.isDeleted && <span>(edited)</span>}
          {isOwn && status === "read" && (
            <CheckCheck className="size-3.5 text-brand-600" />
          )}
          {isOwn && status === "delivered" && (
            <CheckCheck className="size-3.5" />
          )}
          {isOwn && status === "sent" && <Check className="size-3.5" />}
        </div>
      </div>
    </div>
  );
}
