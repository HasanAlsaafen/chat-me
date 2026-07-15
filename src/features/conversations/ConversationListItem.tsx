import { useState } from "react";
import clsx from "clsx";
import { NavLink } from "react-router-dom";
import { Archive, ArchiveRestore, BellOff, Pin } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { MessageContextMenu } from "../chat/MessageContextMenu";
import { useLocalPrefsStore } from "../../store/localPrefsStore";
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
  const conversationId = getId(conversation);
  const flags = useLocalPrefsStore(
    (s) => s.conversationFlags[conversationId],
  );
  const toggleConversationFlag = useLocalPrefsStore(
    (s) => s.toggleConversationFlag,
  );
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="relative" onContextMenu={openMenu}>
      <NavLink
        to={`/c/${conversationId}`}
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
            <span className="flex min-w-0 items-center gap-1 truncate text-sm font-medium text-neutral-800 dark:text-gray-100">
              {flags?.pinned && (
                <Pin className="size-3 shrink-0 text-brand-600" />
              )}
              <span className="truncate">{name}</span>
              {flags?.muted && (
                <BellOff className="size-3 shrink-0 text-neutral-100" />
              )}
            </span>
            <span className="shrink-0 text-xs text-neutral-100">
              {formatTimestamp(conversation.lastMessageAt)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-xs text-neutral-300 dark:text-gray-400">
              {previewText(conversation)}
            </span>
            {unreadCount > 0 && !flags?.muted && (
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
        </div>
      </NavLink>
      {menuPos && (
        <MessageContextMenu x={menuPos.x} y={menuPos.y} onClose={() => setMenuPos(null)}>
          <button
            type="button"
            onClick={() => {
              toggleConversationFlag(conversationId, "pinned");
              setMenuPos(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <Pin className="size-4" /> {flags?.pinned ? "Unpin" : "Pin"} chat
          </button>
          <button
            type="button"
            onClick={() => {
              toggleConversationFlag(conversationId, "muted");
              setMenuPos(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <BellOff className="size-4" /> {flags?.muted ? "Unmute" : "Mute"}
          </button>
          <button
            type="button"
            onClick={() => {
              toggleConversationFlag(conversationId, "archived");
              setMenuPos(null);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            {flags?.archived ? (
              <>
                <ArchiveRestore className="size-4" /> Unarchive
              </>
            ) : (
              <>
                <Archive className="size-4" /> Archive
              </>
            )}
          </button>
        </MessageContextMenu>
      )}
    </div>
  );
}
