import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Settings } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { GroupSettingsModal } from "../conversations/GroupSettingsModal";
import { MessageSearchModal } from "./MessageSearchModal";
import { conversationAvatar, conversationName } from "../../utils/conversation";
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
        <Avatar src={avatar} name={name} />
        <div>
          <p className="text-sm font-semibold text-neutral-800 dark:text-gray-100">
            {name}
          </p>
          {conversation.type === "group" && (
            <p className="text-xs text-neutral-100">
              {conversation.members.length} members
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
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
