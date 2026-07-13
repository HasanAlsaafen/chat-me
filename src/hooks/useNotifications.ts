import { useEffect } from "react";
import { notificationsApi } from "../api/notifications";
import { useNotificationStore } from "../store/notificationStore";
import { useAuthStore } from "../store/authStore";

export function useNotifications() {
  const status = useAuthStore((s) => s.status);
  const setUnread = useNotificationStore((s) => s.setUnread);
  const setCount = useNotificationStore((s) => s.setCount);

  useEffect(() => {
    if (status !== "authenticated") return;
    void notificationsApi.listUnread().then(setUnread);
    void notificationsApi.count().then(setCount);
  }, [status, setUnread, setCount]);
}
