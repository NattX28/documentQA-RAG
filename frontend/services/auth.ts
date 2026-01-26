import api from "@/lib/api";

import { LoginResponse, RegisterResponse } from "@/types/auth";

export const login = (email: string, password: string) => {
  return api.post<LoginResponse>("/auth/login", {
    email,
    password,
  });
};

export const register = (email: string, password: string, name?: string) => {
  return api.post<RegisterResponse>("/auth/register", {
    email,
    password,
    name,
  });
};
