/* ── Auth API calls ── */

import type { LoginPayload, SignupPayload, Token, UserResponse } from "../types";
import api from "./api";

export const authService = {
  signup: async (payload: SignupPayload): Promise<UserResponse> => {
    const { data } = await api.post<UserResponse>("/api/auth/signup", payload);
    return data;
  },

  login: async (payload: LoginPayload): Promise<Token> => {
    const { data } = await api.post<Token>("/api/auth/login", payload);
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data;
  },

  getMe: async (): Promise<UserResponse> => {
    const { data } = await api.get<UserResponse>("/api/auth/me");
    return data;
  },

  logout: () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem("access_token");
  },
};
