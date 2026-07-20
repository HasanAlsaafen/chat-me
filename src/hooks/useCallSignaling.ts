import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { bindCallListeners } from "../lib/callSession";

export function useCallSignaling() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== "authenticated") return;
    return bindCallListeners();
  }, [status]);
}
