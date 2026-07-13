import { format, isToday, isYesterday, formatDistanceToNow } from "date-fns";

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return format(date, "HH:mm");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d");
}

export function formatMessageTime(iso: string): string {
  return format(new Date(iso), "HH:mm");
}

export function formatRelative(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
