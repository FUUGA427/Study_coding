import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
} from "@learning-platform/shared-types";
import { api } from "@/lib/api";

export async function login(body: LoginRequest) {
  const { data } = await api.post<TokenResponse>("/auth/login", body);
  return data;
}

export async function register(body: RegisterRequest) {
  const { data } = await api.post<TokenResponse>("/auth/register", body);
  return data;
}

export async function guestLogin() {
  const { data } = await api.post<TokenResponse>("/auth/guest");
  return data;
}
