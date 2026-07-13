import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Avatar } from "../../components/ui/Avatar";
import { Spinner } from "../../components/ui/Spinner";
import { useUserSearch } from "../../hooks/useUserSearch";
import { conversationsApi } from "../../api/conversations";
import { refreshConversations } from "../../hooks/useConversations";
import { getApiErrorMessage } from "../../api/client";
import { getId } from "../../utils/id";

export function NewChatModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [term, setTerm] = useState("");
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const { data: users, isFetching } = useUserSearch(term);
  const navigate = useNavigate();

  const startConversation = async (userId: string) => {
    setCreatingId(userId);
    try {
      const conversation = await conversationsApi.createDirect(userId);
      await refreshConversations();
      onClose();
      setTerm("");
      navigate(`/c/${getId(conversation)}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setCreatingId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="New conversation">
      <Input
        autoFocus
        placeholder="Search by name or email…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <div className="mt-3 flex flex-col gap-1">
        {isFetching && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}
        {!isFetching && term.trim().length >= 2 && users?.length === 0 && (
          <p className="py-4 text-center text-sm text-neutral-100">
            No users found
          </p>
        )}
        {users?.map((user) => (
          <button
            type="button"
            key={getId(user)}
            onClick={() => void startConversation(getId(user))}
            disabled={creatingId !== null}
            className="flex items-center gap-3 rounded-[3px] px-2 py-2 text-left hover:bg-neutral-20 disabled:opacity-50 dark:hover:bg-gray-800"
          >
            <Avatar src={user.avatar} name={user.displayName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800 dark:text-gray-100">
                {user.displayName}
              </p>
              <p className="truncate text-xs text-neutral-300 dark:text-gray-400">
                {user.email}
              </p>
            </div>
            {creatingId === getId(user) && <Spinner className="size-4" />}
          </button>
        ))}
      </div>
    </Modal>
  );
}
