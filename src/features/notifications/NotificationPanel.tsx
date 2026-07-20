import { useNavigate } from "react-router-dom";
import { Bell, MessageSquare, Phone, UserPlus, UserMinus, Video } from "lucide-react";
import { notificationsApi } from "../../api/notifications";
import { useNotificationStore } from "../../store/notificationStore";
import { formatRelative } from "../../utils/date";
import { getId } from "../../utils/id";
import type {
  MissedCallNotificationPayload,
  NewMessageNotificationPayload,
} from "../../types";

function iconFor(type: string, callType?: string) {
  if (type === "new_message") return MessageSquare;
  if (type === "group_added") return UserPlus;
  if (type === "group_removed") return UserMinus;
  if (type === "missed_call") return callType === "video" ? Video : Phone;
  return Bell;
}

export function NotificationPanel({ close }: { close: () => void }) {
  const unread = useNotificationStore((s) => s.unread);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const navigate = useNavigate();

  const handleClick = async (id: string, conversationId?: string) => {
    markAsRead(id);
    close();
    if (conversationId) navigate(`/c/${conversationId}`);
    if (!id.startsWith("live-")) {
      try {
        await notificationsApi.markAsRead(id);
      } catch {
        // best-effort
      }
    }
  };

  const handleMarkAll = async () => {
    markAllAsRead();
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      // best-effort
    }
  };

  return (
    <div className="flex max-h-96 w-80 max-w-[calc(100vw-2rem)] flex-col">
      <div className="flex items-center justify-between border-b border-neutral-30 px-3 py-2 dark:border-gray-800">
        <span className="text-sm font-semibold text-neutral-800 dark:text-gray-100">
          Notifications
        </span>
        {unread.length > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            className="text-xs font-medium text-brand-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {unread.length === 0 && (
          <p className="px-3 py-8 text-center text-sm text-neutral-100">
            You&apos;re all caught up
          </p>
        )}
        {unread.map((n) => {
          const isMissedCall = n.type === "missed_call";
          const payload = n.payload as
            | NewMessageNotificationPayload
            | MissedCallNotificationPayload;
          const Icon = iconFor(
            n.type,
            isMissedCall ? (payload as MissedCallNotificationPayload).type : undefined,
          );
          return (
            <button
              type="button"
              key={getId(n)}
              onClick={() => void handleClick(getId(n), payload.conversationId)}
              className="flex w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-neutral-20 dark:hover:bg-gray-800/60"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-neutral-800 dark:text-gray-100">
                  {isMissedCall ? (
                    <>
                      <span className="font-medium">
                        {(payload as MissedCallNotificationPayload).callerName}
                      </span>{" "}
                      missed {(payload as MissedCallNotificationPayload).type} call
                    </>
                  ) : "senderName" in payload && payload.senderName ? (
                    <>
                      <span className="font-medium">{payload.senderName}</span>{" "}
                      {payload.preview}
                    </>
                  ) : (
                    n.type.replace("_", " ")
                  )}
                </span>
                <span className="block text-xs text-neutral-100">
                  {formatRelative(n.createdAt)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
