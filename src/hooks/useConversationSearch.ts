import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { conversationsApi } from "../api/conversations";

export function useConversationSearch(term: string) {
  const [debounced, setDebounced] = useState(term);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(timeout);
  }, [term]);

  return useQuery({
    queryKey: ["conversations", "search", debounced],
    queryFn: () => conversationsApi.search(debounced),
    enabled: debounced.trim().length >= 2,
    staleTime: 30_000,
  });
}
