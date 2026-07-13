import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageCircle,
  Plus,
  Users,
  MessageSquarePlus,
  LogOut,
  User as UserIcon,
  ChevronUp,
} from "lucide-react";
import { Dropdown } from "../../components/ui/Dropdown";
import { Avatar } from "../../components/ui/Avatar";
import { Input } from "../../components/ui/Input";
import { NotificationBell } from "../notifications/NotificationBell";
import { InstallButton } from "../../components/InstallButton";
import { ProfileModal } from "../profile/ProfileModal";
import { ConversationList } from "./ConversationList";
import { NewChatModal } from "./NewChatModal";
import { NewGroupModal } from "./NewGroupModal";
import { useAuthStore } from "../../store/authStore";

export function Sidebar({ className }: { className?: string }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className={`flex h-full flex-col border-r border-neutral-30 bg-white dark:border-gray-800 dark:bg-gray-950 ${className ?? ""}`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-[3px] bg-brand-600 text-white">
            <MessageCircle className="size-4" />
          </div>
          <span className="text-base font-semibold text-neutral-800 dark:text-gray-100">
            ChatMe
          </span>
        </div>
        <div className="flex items-center gap-1">
          <InstallButton />
          <NotificationBell />
          <Dropdown
            trigger={({ toggle }) => (
              <button
                type="button"
                onClick={toggle}
                className="rounded-[3px] p-2 text-neutral-300 hover:bg-neutral-20 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label="New conversation"
              >
                <Plus className="size-5" />
              </button>
            )}
          >
            {({ close }) => (
              <div className="flex flex-col py-1">
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setShowNewChat(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <MessageSquarePlus className="size-4" /> New chat
                </button>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setShowNewGroup(true);
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Users className="size-4" /> New group
                </button>
              </div>
            )}
          </Dropdown>
        </div>
      </div>

      <div className="px-3 pb-2">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search groups…"
          className="h-9"
        />
      </div>

      <ConversationList searchTerm={searchTerm} />

      <Dropdown
        align="left"
        panelClassName="!bottom-full !mt-0 mb-2"
        trigger={({ toggle }) => (
          <button
            type="button"
            onClick={toggle}
            aria-label="Account menu"
            className="flex w-full items-center gap-3 border-t border-neutral-30 px-4 py-3 text-left hover:bg-neutral-20 dark:border-gray-800 dark:hover:bg-gray-800/60"
          >
            <Avatar src={user.avatar} name={user.displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800 dark:text-gray-100">
                {user.displayName}
              </p>
              <p className="truncate text-xs text-neutral-100">
                {user.email}
              </p>
            </div>
            <ChevronUp className="size-4 shrink-0 text-neutral-100" />
          </button>
        )}
      >
        {({ close }) => (
          <div className="flex flex-col py-1">
            <button
              type="button"
              onClick={() => {
                close();
                setShowProfile(true);
              }}
              className="flex items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-20 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              <UserIcon className="size-4" /> Profile
            </button>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex items-center gap-2 px-3 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-red-950"
            >
              <LogOut className="size-4" /> Log out
            </button>
          </div>
        )}
      </Dropdown>

      <NewChatModal open={showNewChat} onClose={() => setShowNewChat(false)} />
      <NewGroupModal
        open={showNewGroup}
        onClose={() => setShowNewGroup(false)}
      />
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}
