import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Ban, MoreVertical, Phone, Search, Settings, Video } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { Dropdown } from "../../components/ui/Dropdown";
import { GroupSettingsModal } from "../conversations/GroupSettingsModal";
import { MessageSearchModal } from "./MessageSearchModal";
import { conversationAvatar, conversationName, otherMember } from "../../utils/conversation";
import { usePresenceStore } from "../../store/presenceStore";
import { useBlockedUsersStore } from "../../store/blockedUsersStore";
import { useCallStore } from "../../store/callStore";
import { startCall } from "../../lib/callSession";
import { usersApi } from "../../api/users";
import { getApiErrorMessage } from "../../api/client";
import { formatRelative } from "../../utils/date";
import { getId } from "../../utils/id";
import type { Conversation } from "../../types";

export function ChatHeader({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId: string;
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const navigate = useNavigate();
  const name = conversationName(conversation, currentUserId);
  const avatar = conversationAvatar(conversation, currentUserId);

  const peer = conversation.type === "direct" ? otherMember(conversation, currentUserId) : undefined;
  const peerId = peer ? getId(peer) : undefined;
  const presence = usePresenceStore((s) => (peerId ? s.byUserId[peerId] : undefined));
  const setPresence = usePresenceStore((s) => s.setPresence);

  useEffect(() => {
    if (!peerId) return;
    usersApi
      .getPresence(peerId)
      .then((p) => {
        setPresence(peerId, { online: p.online, lastSeenAt: p.lastSeenAt });
      })
      .catch(() => {
        // Presence endpoint unavailable — fall back to the peer's last
        // known lastSeenAt (already present on the conversation payload)
        // rather than showing nothing.
        if (peer?.lastSeenAt) {
          setPresence(peerId, { online: false, lastSeenAt: peer.lastSeenAt });
        }
      });
  }, [peerId, peer?.lastSeenAt, setPresence]);

  const isBlocked = useBlockedUsersStore((s) => (peerId ? s.ids.has(peerId) : false));
  const blockUserInStore = useBlockedUsersStore((s) => s.block);
  const unblockUserInStore = useBlockedUsersStore((s) => s.unblock);
  const [blockBusy, setBlockBusy] = useState(false);
  const callIdle = useCallStore((s) => s.phase === "idle");

  const placeCall = (type: "audio" | "video") => {
    if (!peerId || !peer) return;
    void startCall(getId(conversation), type, {
      id: peerId,
      name: peer.displayName,
      avatar: peer.avatar,
    });
  };

  const lastSeenAt = presence?.lastSeenAt ?? peer?.lastSeenAt;
  const statusText = conversation.type === "group"
    ? `${conversation.members.length} members`
    : isBlocked
      ? "Blocked"
      : presence?.online
        ? "Online"
        : lastSeenAt
          ? `Last seen ${formatRelative(lastSeenAt)}`
          : undefined;

  const toggleBlock = async () => {
    if (!peerId) return;
    setBlockBusy(true);
    try {
      if (isBlocked) {
        await usersApi.unblock(peerId);
        unblockUserInStore(peerId);
        toast.success(`Unblocked ${name}`);
      } else {
        await usersApi.block(peerId);
        blockUserInStore(peerId);
        toast.success(`Blocked ${name}`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBlockBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-neutral-30 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="rounded-[3px] p-1.5 text-neutral-300 hover:bg-neutral-20 md:hidden dark:hover:bg-gray-800"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Avatar
          src={avatar}
          name={name}
          online={conversation.type === "direct" ? presence?.online : undefined}
        />
        <div>
          <p className="text-sm font-semibold text-neutral-800 dark:text-gray-100">
            {name}
          </p>
          {statusText && (
            <p className="text-xs text-neutral-100">{statusText}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {conversation.type === "direct" && peerId && !isBlocked && (
          <>
            <button
              type="button"
              onClick={() => placeCall("audio")}
              disabled={!callIdle}
              className="rounded-[3px] p-2 text-neutral-100 hover:bg-neutral-20 disabled:opacity-40 dark:hover:bg-gray-800"
              aria-label="Voice call"
            >
              <Phone className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => placeCall("video")}
              disabled={!callIdle}
              className="rounded-[3px] p-2 text-neutral-100 hover:bg-neutral-20 disabled:opacity-40 dark:hover:bg-gray-800"
              aria-label="Video call"
            >
              <Video className="size-5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setShowSearch(true)}
          className="rounded-[3px] p-2 text-neutral-100 hover:bg-neutral-20 dark:hover:bg-gray-800"
          aria-label="Search messages"
        >
          <Search className="size-5" />
        </button>
        {conversation.type === "group" && (
          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="rounded-[3px] p-2 text-neutral-100 hover:bg-neutral-20 dark:hover:bg-gray-800"
            aria-label="Group settings"
          >
            <Settings className="size-5" />
          </button>
        )}
        {conversation.type === "direct" && peerId && (
          <Dropdown
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className="rounded-[3px] p-2 text-neutral-100 hover:bg-neutral-20 dark:hover:bg-gray-800"
                aria-label="More options"
              >
                <MoreVertical className="size-5" />
              </button>
            )}
          >
            {({ close }) => (
              <button
                type="button"
                disabled={blockBusy}
                onClick={() => {
                  close();
                  void toggleBlock();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 hover:bg-neutral-20 disabled:opacity-50 dark:text-danger-400 dark:hover:bg-gray-800"
              >
                <Ban className="size-4" />
                {isBlocked ? `Unblock ${name}` : `Block ${name}`}
              </button>
            )}
          </Dropdown>
        )}
      </div>
      {showSettings && (
        <GroupSettingsModal
          open={showSettings}
          onClose={() => setShowSettings(false)}
          conversation={conversation}
          currentUserId={currentUserId}
        />
      )}
      {showSearch && (
        <MessageSearchModal
          open={showSearch}
          onClose={() => setShowSearch(false)}
          conversation={conversation}
        />
      )}
    </div>
  );
}
