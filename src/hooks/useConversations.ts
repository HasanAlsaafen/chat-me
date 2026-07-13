import { useEffect, useState } from "react";
import { conversationsApi } from "../api/conversations";
import { useChatStore } from "../store/chatStore";
import { useAuthStore } from "../store/authStore";
import { getApiErrorMessage } from "../api/client";

export async function refreshConversations(): Promise<void> {
  const data = await conversationsApi.list();
  useChatStore.getState().setConversations(data);
}

/** Triggers the initial conversations fetch once the user is authenticated. Mount this once near the app root. */
export function useConversations() {
  const status = useAuthStore((s) => s.status);
  const conversations = useChatStore((s) => s.conversations);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    refreshConversations()
      .catch((err: unknown) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  return { conversations, loading, error };
}
