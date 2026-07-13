import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { Avatar } from "../../components/ui/Avatar";
import type { Conversation } from "../../types";
import { conversationAvatar, conversationName } from "../../utils/conversation";
import { formatTimestamp } from "../../utils/date";
import { getId } from "../../utils/id";

interface Props {
  conversation: Conversation;
  currentUserId: string;
  unreadCount: number;
}

function previewText(conversation: Conversation): string {
  const message = conversation.lastMessage;
  if (!message) return "No messages yet";
  if (message.type !== "text")
    return `Sent ${message.type === "file" ? "a file" : `an ${message.type}`}`;
  return message.content;
}

export function ConversationListItem({
  conversation,
  currentUserId,
  unreadCount,
}: Props) {
  const name = conversationName(conversation, currentUserId);
  const avatar = conversationAvatar(conversation, currentUserId);

  return (
    <NavLink
      to={`/c/${getId(conversation)}`}
      className={({ isActive }) =>
        clsx(
          "flex items-center gap-3 rounded-[3px] px-3 py-2.5 transition-colors",
          isActive
            ? "bg-brand-50 dark:bg-brand-900/40"
            : "hover:bg-neutral-20 dark:hover:bg-gray-800/60",
        )
      }
    >
      <Avatar src={avatar} name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-neutral-800 dark:text-gray-100">
            {name}
          </span>
          <span className="shrink-0 text-xs text-neutral-100">
            {formatTimestamp(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-neutral-300 dark:text-gray-400">
            {previewText(conversation)}
          </span>
          {unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </NavLink>
  );
}
