import { ApiError, request, setUnauthorizedHandler } from '@/lib/api-client';
import { resolveApiUrl } from '@/lib/api-url';
import { jsonResponse, mockFetch, networkDown, resetMocks, TOKEN } from './helpers';

describe('api-client', () => {
  const onUnauthorized = jest.fn();

  beforeEach(() => {
    resetMocks();
    setUnauthorizedHandler(onUnauthorized);
  });
  afterEach(() => setUnauthorizedHandler(null));

  it('envía JSON y el header Bearer cuando hay token', async () => {
    const fetchMock = mockFetch({ 'POST /auth/logout': () => jsonResponse(204) });

    await expect(request('/auth/logout', { method: 'POST', token: TOKEN })).resolves.toBeUndefined();

    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe(`Bearer ${TOKEN}`);
  });

  it('F-10: si el backend está apagado devuelve un error de red controlado', async () => {
    mockFetch({ 'GET /auth/me': networkDown });

    const error = await request('/auth/me').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'network',
      message: 'No pudimos conectar con el servidor. Revisá tu conexión.',
    });
  });

  it('F-10: si el servidor no responde a tiempo devuelve un error de timeout', async () => {
    mockFetch({
      'GET /auth/me': (init) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    });

    const error = await request('/auth/me', { timeoutMs: 20 }).catch((e: unknown) => e);

    expect(error).toMatchObject({ kind: 'timeout' });
  });

  it('traduce el error del backend (status, code y fields)', async () => {
    mockFetch({
      'POST /auth/register': () =>
        jsonResponse(400, {
          error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos', fields: { email: 'El email no es válido' } },
        }),
    });

    const error = await request('/auth/register', { method: 'POST', body: {} }).catch((e: unknown) => e);

    expect(error).toMatchObject({
      kind: 'http',
      status: 400,
      code: 'VALIDATION_ERROR',
      fields: { email: 'El email no es válido' },
    });
  });

  it('F-06: el 401 del login (sin token) no dispara el interceptor', async () => {
    mockFetch({
      'POST /auth/login': () =>
        jsonResponse(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' } }),
    });

    await expect(request('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('S-02: un 401 en un request autenticado dispara el interceptor', async () => {
    mockFetch({
      'GET /auth/me': () => jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Sesión inválida o expirada' } }),
    });

    await expect(request('/auth/me', { token: TOKEN })).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});

describe('resolveApiUrl', () => {
  it('prioriza EXPO_PUBLIC_API_URL y le saca la barra final', () => {
    expect(resolveApiUrl('http://10.0.2.2:3000/', '192.168.1.50:8081')).toBe('http://10.0.2.2:3000');
  });

  it('sin variable, usa la IP de Metro con el puerto del backend', () => {
    expect(resolveApiUrl(undefined, '192.168.1.50:8081')).toBe('http://192.168.1.50:3000');
  });

  it('sin variable ni hostUri, cae en localhost', () => {
    expect(resolveApiUrl(undefined, undefined)).toBe('http://localhost:3000');
  });
});
