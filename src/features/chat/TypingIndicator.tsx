import { useChatStore } from "../../store/chatStore";
import { getId } from "../../utils/id";
import type { Conversation } from "../../types";

export function TypingIndicator({
  conversation,
  currentUserId,
}: {
  conversation: Conversation;
  currentUserId: string;
}) {
  const conversationId = getId(conversation);
  const typingIds =
    useChatStore((s) => s.typingByConversation[conversationId]) ?? [];
  const others = typingIds.filter((id) => id !== currentUserId);
  if (others.length === 0) return null;

  const names = others.map((id) => {
    const member = conversation.members.find(
      (m) => typeof m !== "string" && getId(m) === id,
    );
    return typeof member === "object" ? member.displayName : "Someone";
  });

  const label =
    names.length === 1
      ? `${names[0]} is typing…`
      : `${names.join(", ")} are typing…`;

  return (
    <p className="px-2 pt-1 text-xs italic text-neutral-100">{label}</p>
  );
}
