import { useGetDashboard } from "@workspace/api-client-react";

export function useDashboardData() {
  return useGetDashboard();
}
