import { request } from '@/lib/api-client';
import type { LoginInput, RegisterInput } from './schemas';

export interface PublicUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export function register(input: RegisterInput) {
  return request<{ user: PublicUser }>('/auth/register', { method: 'POST', body: input });
}

export function login(input: LoginInput) {
  return request<{ token: string; expiresAt: string; user: PublicUser }>('/auth/login', {
    method: 'POST',
    body: input,
  });
}

export function me(token: string) {
  return request<{ user: PublicUser; session: { expiresAt: string } }>('/auth/me', { token });
}

export function logout(token: string) {
  return request<void>('/auth/logout', { method: 'POST', token });
}
