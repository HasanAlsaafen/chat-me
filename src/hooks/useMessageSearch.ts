import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { messagesApi } from "../api/messages";

export function useMessageSearch(conversationId: string, term: string) {
  const [debounced, setDebounced] = useState(term);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(timeout);
  }, [term]);

  return useQuery({
    queryKey: ["messages", "search", conversationId, debounced],
    queryFn: () => messagesApi.search(conversationId, debounced),
    enabled: debounced.trim().length >= 2,
    staleTime: 30_000,
  });
}
