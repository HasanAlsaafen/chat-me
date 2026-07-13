import { useState } from "react";
import { Search } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Spinner } from "../../components/ui/Spinner";
import { useMessageSearch } from "../../hooks/useMessageSearch";
import { getId } from "../../utils/id";
import { formatTimestamp } from "../../utils/date";
import type { Conversation } from "../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
}

export function MessageSearchModal({ open, onClose, conversation }: Props) {
  const [term, setTerm] = useState("");
  const conversationId = getId(conversation);
  const { data: results, isFetching } = useMessageSearch(conversationId, term);

  const resolveSenderName = (sender: string) => {
    const member = conversation.members.find(
      (m) => typeof m !== "string" && getId(m) === sender,
    );
    return typeof member === "object" ? member.displayName : "Unknown";
  };

  return (
    <Modal open={open} onClose={onClose} title="Search messages">
      <div className="flex flex-col gap-3">
        <Input
          autoFocus
          placeholder="Search this conversation…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        {isFetching && (
          <div className="flex justify-center py-3">
            <Spinner />
          </div>
        )}
        {!isFetching && term.trim().length >= 2 && results?.length === 0 && (
          <p className="py-3 text-center text-sm text-neutral-100">
            No messages found.
          </p>
        )}
        <div className="flex flex-col gap-1">
          {results?.map((message) => (
            <div
              key={getId(message)}
              className="flex items-start gap-2 rounded-[3px] px-2 py-2 hover:bg-neutral-20 dark:hover:bg-gray-800"
            >
              <Search className="mt-0.5 size-3.5 shrink-0 text-neutral-100" />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-xs font-medium text-neutral-300 dark:text-gray-400">
                  {resolveSenderName(
                    typeof message.sender === "string"
                      ? message.sender
                      : getId(message.sender),
                  )}
                  <span className="font-normal text-neutral-100">
                    {formatTimestamp(message.createdAt)}
                  </span>
                </p>
                <p className="truncate text-sm text-neutral-800 dark:text-gray-100">
                  {message.type === "text"
                    ? message.content
                    : `${message.type} attachment`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
