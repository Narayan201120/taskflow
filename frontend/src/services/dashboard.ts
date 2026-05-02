/* ── Dashboard API calls ── */

import type { DashboardStats, TaskResponse } from "../types";
import api from "./api";

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>("/api/dashboard/");
    return data;
  },

  getMyTasks: async (): Promise<TaskResponse[]> => {
    const { data } = await api.get<TaskResponse[]>("/api/dashboard/my-tasks");
    return data;
  },
};
