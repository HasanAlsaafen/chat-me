import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Avatar } from "../../components/ui/Avatar";
import { useChatStore } from "../../store/chatStore";
import { useAuthStore } from "../../store/authStore";
import { getId } from "../../utils/id";
import { conversationAvatar, conversationName } from "../../utils/conversation";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const conversations = useChatStore((s) => s.conversations);
  const currentUser = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const currentUserId = currentUser ? getId(currentUser) : "";

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const named = conversations.map((c) => ({
      conversation: c,
      name: conversationName(c, currentUserId),
    }));
    if (!q) return named.slice(0, 8);
    return named
      .filter(({ name }) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [conversations, currentUserId, query]);

  if (!open || !currentUser) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 p-4 pt-24">
      <div className="absolute inset-0" onClick={() => setOpen(false)} aria-hidden />
      <div className="relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-[6px] bg-white shadow-[var(--shadow-overlay)] dark:bg-gray-900">
        <div className="flex items-center gap-2 border-b border-neutral-30 px-4 py-3 dark:border-gray-800">
          <Search className="size-4 text-neutral-100" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to conversation…"
            className="flex-1 bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-100 dark:text-gray-100"
          />
          <kbd className="rounded border border-neutral-30 px-1.5 py-0.5 text-[10px] text-neutral-100 dark:border-gray-700">
            Esc
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-neutral-100">
              No conversations found.
            </p>
          )}
          {results.map(({ conversation, name }) => (
            <button
              key={getId(conversation)}
              type="button"
              onClick={() => {
                navigate(`/c/${getId(conversation)}`);
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-neutral-20 dark:hover:bg-gray-800"
            >
              <Avatar
                src={conversationAvatar(conversation, currentUserId)}
                name={name}
                size="sm"
              />
              <span className="truncate text-sm font-medium text-neutral-800 dark:text-gray-100">
                {name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
