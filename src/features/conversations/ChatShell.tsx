import { Route, Routes, useLocation } from "react-router-dom";
import clsx from "clsx";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";
import { ChatPage } from "../chat/ChatPage";
import { EmptyChatState } from "../chat/EmptyChatState";
import { useConversations } from "../../hooks/useConversations";
import { useNotifications } from "../../hooks/useNotifications";
import { useSocketBridge } from "../../hooks/useSocketBridge";

export function ChatShell() {
  useConversations();
  useNotifications();
  useSocketBridge();

  const location = useLocation();
  const hasActiveConversation = location.pathname.startsWith("/c/");

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-gray-950">
      <CommandPalette />
      <div
        className={clsx(
          "h-full w-full shrink-0 md:w-80",
          hasActiveConversation && "hidden md:block",
        )}
      >
        <Sidebar />
      </div>
      <div
        className={clsx(
          "h-full flex-1",
          !hasActiveConversation && "hidden md:flex",
        )}
      >
        <Routes>
          <Route index element={<EmptyChatState />} />
          <Route path="c/:conversationId" element={<ChatPage />} />
        </Routes>
      </div>
    </div>
  );
}
