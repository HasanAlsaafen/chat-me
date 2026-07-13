import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usersApi } from "../api/users";

export function useUserSearch(term: string) {
  const [debounced, setDebounced] = useState(term);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(timeout);
  }, [term]);

  return useQuery({
    queryKey: ["users", "search", debounced],
    queryFn: () => usersApi.search(debounced),
    enabled: debounced.trim().length >= 2,
    staleTime: 30_000,
  });
}
