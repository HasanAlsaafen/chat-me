import { useEffect, useState } from "react";
import clsx from "clsx";
import { NavLink, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Archive, ArchiveRestore, BellOff, Pin, Trash2 } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Modal } from "../../components/ui/Modal";
import { Button } from "../../components/ui/Button";
import { MessageContextMenu } from "../chat/MessageContextMenu";
import { useLocalPrefsStore } from "../../store/localPrefsStore";
import { usePresenceStore } from "../../store/presenceStore";
import { useChatStore } from "../../store/chatStore";
import { usersApi } from "../../api/users";
import { conversationsApi } from "../../api/conversations";
import { getApiErrorMessage } from "../../api/client";
import type { Conversation } from "../../types";
import { conversationAvatar, conversationName, otherMember } from "../../utils/conversation";
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
  const peer = conversation.type === "direct" ? otherMember(conversation, currentUserId) : undefined;
  const peerId = peer ? getId(peer) : undefined;
  const online = usePresenceStore((s) => (peerId ? s.byUserId[peerId]?.online : undefined));
  const setPresence = usePresenceStore((s) => s.setPresence);

  useEffect(() => {
    if (!peerId) return;
    usersApi
      .getPresence(peerId)
      .then((p) => {
        setPresence(peerId, { online: p.online, lastSeenAt: p.lastSeenAt });
      })
      .catch(() => {
        // Ignore — the dot just stays hidden until a socket event arrives.
      });
  }, [peerId, setPresence]);
  const flags = useLocalPrefsStore(
    (s) => s.conversationFlags[conversationId],
  );
  const toggleConversationFlag = useLocalPrefsStore(
    (s) => s.toggleConversationFlag,
  );
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const navigate = useNavigate();

  const openMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      // The backend has no whole-conversation delete route. /leave only
      // accepts group conversations ("not a group conversation" otherwise),
      // so for a direct chat we remove the current user as a member instead
      // via the same member-removal route GroupSettingsModal uses.
      if (conversation.type === "group") {
        await conversationsApi.leave(conversationId);
      } else {
        await conversationsApi.removeMember(conversationId, currentUserId);
      }
      removeConversation(conversationId);
      if (activeConversationId === conversationId) navigate("/", { replace: true });
      setConfirmingDelete(false);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setDeleting(false);
    }
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
        <Avatar src={avatar} name={name} online={online} />
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
          <button
            type="button"
            onClick={() => {
              setMenuPos(null);
              setConfirmingDelete(true);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 hover:bg-neutral-20 dark:text-danger-400 dark:hover:bg-gray-800"
          >
            <Trash2 className="size-4" /> Delete chat
          </button>
        </MessageContextMenu>
      )}
      <Modal
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        title="Delete chat"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmingDelete(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void confirmDelete()}
              loading={deleting}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-700 dark:text-gray-200">
          {conversation.type === "group"
            ? `Delete this chat? You'll leave "${name}" and won't be able to view new activity here afterwards.`
            : `Delete this chat with ${name}? This cannot be undone.`}
        </p>
      </Modal>
    </div>
  );
}
