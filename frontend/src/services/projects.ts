/* ── Project & Member API calls ── */

import type {
  MemberAdd,
  ProjectCreate,
  ProjectDetailResponse,
  ProjectMemberResponse,
  ProjectResponse,
  ProjectUpdate,
} from "../types";
import api from "./api";

export const projectService = {
  list: async (): Promise<ProjectResponse[]> => {
    const { data } = await api.get<ProjectResponse[]>("/api/projects/");
    return data;
  },

  get: async (id: string): Promise<ProjectDetailResponse> => {
    const { data } = await api.get<ProjectDetailResponse>(`/api/projects/${id}`);
    return data;
  },

  create: async (payload: ProjectCreate): Promise<ProjectResponse> => {
    const { data } = await api.post<ProjectResponse>("/api/projects/", payload);
    return data;
  },

  update: async (id: string, payload: ProjectUpdate): Promise<ProjectResponse> => {
    const { data } = await api.put<ProjectResponse>(`/api/projects/${id}`, payload);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/projects/${id}`);
  },

  // Members
  listMembers: async (projectId: string): Promise<ProjectMemberResponse[]> => {
    const { data } = await api.get<ProjectMemberResponse[]>(
      `/api/projects/${projectId}/members`
    );
    return data;
  },

  addMember: async (
    projectId: string,
    payload: MemberAdd
  ): Promise<ProjectMemberResponse> => {
    const { data } = await api.post<ProjectMemberResponse>(
      `/api/projects/${projectId}/members`,
      payload
    );
    return data;
  },

  updateMemberRole: async (
    projectId: string,
    userId: string,
    role: string
  ): Promise<ProjectMemberResponse> => {
    const { data } = await api.put<ProjectMemberResponse>(
      `/api/projects/${projectId}/members/${userId}`,
      { role }
    );
    return data;
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/members/${userId}`);
  },
};
