import axios from "axios";
import type { InternalAxiosRequestConfig } from "axios";

import { getToken } from "../services/tokenService";

export interface ProfileResponse {
  username: string;
  email: string;
  role: string;
}

export interface UpdateProfilePayload {
  currentPassword: string;
  newEmail?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  token: string;
  username: string;
  email: string;
}

const profileApi = axios.create({
  baseURL: "/api/auth",
});

profileApi.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getProfile = () => profileApi.get<ProfileResponse>("profile");
export const updateProfile = (payload: UpdateProfilePayload) =>
  profileApi.put<UpdateProfileResponse>("profile", payload);

export default profileApi;
