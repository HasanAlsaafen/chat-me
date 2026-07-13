import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { LogOut, UserMinus } from "lucide-react";
import { Modal } from "../../components/ui/Modal";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { Spinner } from "../../components/ui/Spinner";
import { useUserSearch } from "../../hooks/useUserSearch";
import { conversationsApi } from "../../api/conversations";
import { useChatStore } from "../../store/chatStore";
import { getApiErrorMessage } from "../../api/client";
import { getId } from "../../utils/id";
import type { Conversation } from "../../types";

interface Props {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  currentUserId: string;
}

export function GroupSettingsModal({
  open,
  onClose,
  conversation,
  currentUserId,
}: Props) {
  const [name, setName] = useState(conversation.name ?? "");
  const [term, setTerm] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const { data: users, isFetching } = useUserSearch(term);
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const removeConversation = useChatStore((s) => s.removeConversation);
  const navigate = useNavigate();

  const isAdmin = conversation.admin === currentUserId;
  const memberIds = new Set(conversation.members.map(getId));

  const rename = async () => {
    if (!name.trim() || name.trim() === conversation.name) return;
    try {
      const updated = await conversationsApi.renameGroup(
        getId(conversation),
        name.trim(),
      );
      upsertConversation(updated);
      toast.success("Group renamed");
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    }
  };

  const addMember = async (userId: string) => {
    setBusyId(userId);
    try {
      const updated = await conversationsApi.addMembers(getId(conversation), [
        userId,
      ]);
      upsertConversation(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (userId: string) => {
    if (userId === currentUserId) {
      setConfirmingLeave(true);
      return;
    }
    setBusyId(userId);
    try {
      const updated = await conversationsApi.removeMember(
        getId(conversation),
        userId,
      );
      upsertConversation(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const confirmLeave = async () => {
    setBusyId(currentUserId);
    try {
      await conversationsApi.leave(getId(conversation));
      removeConversation(getId(conversation));
      onClose();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err));
      setConfirmingLeave(false);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Group settings">
      <div className="flex flex-col gap-4">
        {confirmingLeave && (
          <div className="flex flex-col gap-2 rounded-[3px] border border-danger-400/30 bg-danger-50 px-3 py-2.5 text-sm text-danger-600 dark:bg-red-950/40 dark:text-red-300">
            <p>Leave this group? You won&apos;t be able to send messages or view new activity here afterwards.</p>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmingLeave(false)}
                disabled={busyId === currentUserId}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => void confirmLeave()}
                loading={busyId === currentUserId}
              >
                Leave group
              </Button>
            </div>
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-gray-200">
            Group name
          </label>
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isAdmin}
            />
            {isAdmin && (
              <Button variant="secondary" onClick={() => void rename()}>
                Save
              </Button>
            )}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-gray-200">
            Members ({conversation.members.length})
          </p>
          <div className="flex flex-col gap-1">
            {conversation.members.map((member) => {
              if (typeof member === "string") return null;
              const id = getId(member);
              const canRemove = isAdmin || id === currentUserId;
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-[3px] px-2 py-2"
                >
                  <Avatar
                    src={member.avatar}
                    name={member.displayName}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-800 dark:text-gray-100">
                      {member.displayName}
                      {id === conversation.admin && (
                        <span className="ml-2 text-xs font-normal text-brand-600">
                          Admin
                        </span>
                      )}
                    </p>
                  </div>
                  {canRemove && (
                    <button
                      type="button"
                      onClick={() => void removeMember(id)}
                      disabled={busyId === id}
                      className="rounded-full p-1.5 text-neutral-100 hover:bg-danger-50 hover:text-danger-600 dark:hover:bg-red-950"
                      aria-label={
                        id === currentUserId
                          ? "Leave group"
                          : `Remove ${member.displayName}`
                      }
                    >
                      {busyId === id ? (
                        <Spinner className="size-4" />
                      ) : id === currentUserId ? (
                        <LogOut className="size-4" />
                      ) : (
                        <UserMinus className="size-4" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div>
            <p className="mb-2 text-sm font-medium text-neutral-700 dark:text-gray-200">
              Add members
            </p>
            <Input
              placeholder="Search users…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <div className="mt-2 flex flex-col gap-1">
              {isFetching && (
                <div className="flex justify-center py-3">
                  <Spinner />
                </div>
              )}
              {users
                ?.filter((u) => !memberIds.has(getId(u)))
                .map((user) => (
                  <button
                    type="button"
                    key={getId(user)}
                    onClick={() => void addMember(getId(user))}
                    disabled={busyId !== null}
                    className="flex items-center gap-3 rounded-[3px] px-2 py-2 text-left hover:bg-neutral-20 disabled:opacity-50 dark:hover:bg-gray-800"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.displayName}
                      size="sm"
                    />
                    <span className="truncate text-sm text-neutral-800 dark:text-gray-100">
                      {user.displayName}
                    </span>
                    {busyId === getId(user) && <Spinner className="size-4" />}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
