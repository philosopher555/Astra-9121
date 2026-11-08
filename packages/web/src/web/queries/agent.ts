import { useQuery } from "@tanstack/react-query";
import { orpc } from "../lib/api";
export function useAgentConfig() {
  return useQuery(orpc.agent.config.queryOptions({ staleTime: 60000 }));
}
