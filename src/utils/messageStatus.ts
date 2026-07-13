import type { Message, MessageStatusValue } from "../types";

const rank: Record<MessageStatusValue, number> = {
  sent: 0,
  delivered: 1,
  read: 2,
};
const order: MessageStatusValue[] = ["sent", "delivered", "read"];

export function aggregateStatus(
  message: Message,
  otherMemberIds: string[],
): MessageStatusValue {
  if (otherMemberIds.length === 0) return "sent";
  let minRank = 2;
  for (const id of otherMemberIds) {
    const receipt = message.receipts.find((r) => r.user === id);
    const value = receipt ? rank[receipt.status] : 0;
    if (value < minRank) minRank = value;
  }
  return order[minRank];
}
