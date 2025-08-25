import axios from "axios";
const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

export type Token = { access_token: string; token_type: string };
export type Me = { id: number; email: string; nickname?: string; created_at: string };

export async function signup(email: string, password: string, nickname?: string) {
  const { data } = await axios.post(`${API_BASE}/auth/signup`, { email, password, nickname });
  return data as Me;
}

export async function login(email: string, password: string) {
  const { data } = await axios.post(`${API_BASE}/auth/login`, { email, password });
  return data as Token;
}

export async function me(token: string) {
  const { data } = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data as Me;
}
