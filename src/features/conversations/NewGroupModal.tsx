import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { X } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Spinner } from "../../components/ui/Spinner";
import { useUserSearch } from "../../hooks/useUserSearch";
import { conversationsApi } from "../../api/conversations";
import { refreshConversations } from "../../hooks/useConversations";
import { getApiErrorMessage } from "../../api/client";
import { getId } from "../../utils/id";
import type { User } from "../../types";

export function NewGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<User[]>([]);
  const [creating, setCreating] = useState(false);
  const { data: users, isFetching } = useUserSearch(term);
  const navigate = useNavigate();

  const toggleUser = (user: User) => {
    setSelected((prev) =>
      prev.some((u) => getId(u) === getId(user))
        ? prev.filter((u) => getId(u) !== getId(user))
        : [...prev, user],
    );
  };

  const close = () => {
    setName("");
    setTerm("");
    setSelected([]);
    onClose();
  };

  const createGroup = async () => {
    if (!name.trim() || selected.length === 0) return;
    setCreating(true);
    try {
      const conversation = await conversationsApi.createGroup(
        name.trim(),
        selected.map((u) => getId(u)),
      );
      await refreshConversations();
      close();
      navigate(`/c/${getId(conversation)}`);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="New group"
      footer={
        <Button
          onClick={() => void createGroup()}
          loading={creating}
          disabled={!name.trim() || selected.length === 0}
        >
          Create group
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        <Input
          placeholder="Group name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selected.map((user) => (
              <span
                key={getId(user)}
                className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-medium text-brand-600 dark:bg-brand-900/40 dark:text-brand-200"
              >
                {user.displayName}
                <button
                  type="button"
                  onClick={() => toggleUser(user)}
                  aria-label={`Remove ${user.displayName}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <Input
          placeholder="Add members…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <div className="flex flex-col gap-1">
          {isFetching && (
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          )}
          {users?.map((user) => {
            const isSelected = selected.some((u) => getId(u) === getId(user));
            return (
              <button
                type="button"
                key={getId(user)}
                onClick={() => toggleUser(user)}
                className="flex items-center gap-3 rounded-[3px] px-2 py-2 text-left hover:bg-neutral-20 dark:hover:bg-gray-800"
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
                <span
                  className={
                    isSelected
                      ? "flex size-5 items-center justify-center rounded-full bg-brand-600 text-white"
                      : "size-5 rounded-full border border-neutral-40 dark:border-gray-600"
                  }
                >
                  {isSelected && "✓"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
