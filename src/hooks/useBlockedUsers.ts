import { useEffect } from "react";
import { usersApi } from "../api/users";
import { useBlockedUsersStore } from "../store/blockedUsersStore";
import { useAuthStore } from "../store/authStore";
import { getId } from "../utils/id";

export function useBlockedUsers() {
  const status = useAuthStore((s) => s.status);
  const setBlocked = useBlockedUsersStore((s) => s.setBlocked);

  useEffect(() => {
    if (status !== "authenticated") return;
    void usersApi.listBlocked().then((users) => setBlocked(users.map(getId)));
  }, [status, setBlocked]);
}
