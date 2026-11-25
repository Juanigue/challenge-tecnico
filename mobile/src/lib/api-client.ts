import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { API_URL } from './api-url';

const DEFAULT_TIMEOUT_MS = 10_000;
// El backend lo guarda como nombre del dispositivo en la lista de sesiones abiertas.
const USER_AGENT = `WOD ${Platform.OS} (${Device.modelName ?? 'dispositivo'})`;

export type ApiErrorKind = 'network' | 'timeout' | 'http';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function getErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Ocurrió un error inesperado. Probá de nuevo.';
}

// Interceptor global: lo registra AuthProvider para cerrar la sesión local.
let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  timeoutMs?: number;
}

interface ErrorBody {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, timeoutMs = DEFAULT_TIMEOUT_MS } = options;

  const headers: Record<string, string> = { Accept: 'application/json', 'User-Agent': USER_AGENT };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw controller.signal.aborted
      ? new ApiError('timeout', 'El servidor tardó demasiado en responder. Probá de nuevo.')
      : new ApiError('network', 'No pudimos conectar con el servidor. Revisá tu conexión.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return undefined as T;

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // Solo un request que mandó token significa "tu sesión ya no vale".
    // El 401 del login (credenciales incorrectas) no debe cerrar nada.
    if (response.status === 401 && token) unauthorizedHandler?.();

    const error = (data as ErrorBody | null)?.error;
    throw new ApiError(
      'http',
      error?.message ?? 'Ocurrió un error inesperado. Probá de nuevo.',
      response.status,
      error?.code,
      error?.fields,
    );
  }

  return data as T;
}
