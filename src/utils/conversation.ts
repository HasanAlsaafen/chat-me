import type { Conversation, User } from "../types";
import { getId } from "./id";

export function otherMember(
  conversation: Conversation,
  currentUserId: string,
): User | undefined {
  return conversation.members.find(
    (m): m is User => typeof m !== "string" && getId(m) !== currentUserId,
  );
}

export function conversationName(
  conversation: Conversation,
  currentUserId: string,
): string {
  if (conversation.type === "group") return conversation.name ?? "Group";
  return (
    otherMember(conversation, currentUserId)?.displayName ?? "Unknown user"
  );
}

export function conversationAvatar(
  conversation: Conversation,
  currentUserId: string,
): string | undefined {
  if (conversation.type === "group") return conversation.avatar;
  return otherMember(conversation, currentUserId)?.avatar;
}
