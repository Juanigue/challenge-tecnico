import { request } from '@/lib/api-client';
import type { LoginInput, ProfileInput, RegisterInput, ResetPasswordInput } from './schemas';

export interface PublicUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface SessionInfo {
  id: number;
  device: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

type TokenResponse = { token: string; expiresAt: string };

export function register(input: RegisterInput) {
  return request<{ user: PublicUser }>('/auth/register', { method: 'POST', body: input });
}

export function login(input: LoginInput) {
  return request<TokenResponse & { user: PublicUser }>('/auth/login', { method: 'POST', body: input });
}

export function me(token: string) {
  return request<{ user: PublicUser; session: { createdAt: string; expiresAt: string } }>('/auth/me', {
    token,
  });
}

export function logout(token: string) {
  return request<void>('/auth/logout', { method: 'POST', token });
}

export function logoutAll(token: string) {
  return request<void>('/auth/logout-all', { method: 'POST', token });
}

export function rotate(token: string) {
  return request<TokenResponse>('/auth/rotate', { method: 'POST', token });
}

export function updateProfile(token: string, input: ProfileInput) {
  return request<{ user: PublicUser }>('/auth/me', { method: 'PATCH', token, body: input });
}

export function listSessions(token: string) {
  return request<{ sessions: SessionInfo[] }>('/auth/sessions', { token });
}

export function revokeSession(token: string, sessionId: number) {
  return request<void>(`/auth/sessions/${sessionId}`, { method: 'DELETE', token });
}

export function forgotPassword(email: string) {
  return request<{ message: string }>('/auth/password/forgot', { method: 'POST', body: { email } });
}

export function resetPassword(input: ResetPasswordInput) {
  return request<void>('/auth/password/reset', { method: 'POST', body: input });
}

export function requestEmailVerification(token: string) {
  return request<{ message: string }>('/auth/email/verification', { method: 'POST', token });
}

export function verifyEmail(token: string, code: string) {
  return request<{ user: PublicUser }>('/auth/email/verify', { method: 'POST', token, body: { code } });
}
