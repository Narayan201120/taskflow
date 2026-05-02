/* ── Task API calls ── */

import type { TaskCreate, TaskResponse, TaskUpdate } from "../types";
import api from "./api";

export const taskService = {
  list: async (projectId: string, filters?: Record<string, string>): Promise<TaskResponse[]> => {
    const params = new URLSearchParams(filters);
    const { data } = await api.get<TaskResponse[]>(
      `/api/projects/${projectId}/tasks/?${params}`
    );
    return data;
  },

  get: async (projectId: string, taskId: string): Promise<TaskResponse> => {
    const { data } = await api.get<TaskResponse>(
      `/api/projects/${projectId}/tasks/${taskId}`
    );
    return data;
  },

  create: async (projectId: string, payload: TaskCreate): Promise<TaskResponse> => {
    const { data } = await api.post<TaskResponse>(
      `/api/projects/${projectId}/tasks/`,
      payload
    );
    return data;
  },

  update: async (
    projectId: string,
    taskId: string,
    payload: TaskUpdate
  ): Promise<TaskResponse> => {
    const { data } = await api.put<TaskResponse>(
      `/api/projects/${projectId}/tasks/${taskId}`,
      payload
    );
    return data;
  },

  delete: async (projectId: string, taskId: string): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/tasks/${taskId}`);
  },
};
