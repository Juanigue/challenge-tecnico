import * as SecureStore from 'expo-secure-store';

export const TOKEN = 'A'.repeat(43);
export const EXPIRES_AT = '2026-12-02T13:00:00.000Z';
export const USER = {
  id: 1,
  firstName: 'Ana',
  lastName: 'García',
  email: 'ana@example.com',
  createdAt: '2026-11-25T13:00:00.000Z',
};

// El saludo de Home depende de la hora: "Buen día", "Buenas tardes" o "Buenas noches".
export const HOME_GREETING = /^(Buen día|Buenas tardes|Buenas noches), Ana\.$/;
// Cualquier texto de Home sirve para afirmar que no hay contenido privado en pantalla.
export const PRIVATE_CONTENT = 'Tu sesión';
export const LOGIN_TITLE = 'Accede a WOD';
export const LOGIN_BUTTON = 'Entrar a WOD';
export const EMAIL_LABEL = 'Email profesional';

export function jsonResponse(status: number, body?: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  } as unknown as Response;
}

type Handler = (init: RequestInit) => Response | Promise<Response>;

// Las claves son "MÉTODO /ruta", por ejemplo "POST /auth/login".
export function mockFetch(routes: Record<string, Handler>): jest.Mock {
  const fetchMock = jest.fn(async (url: string, init: RequestInit = {}) => {
    const key = `${init.method ?? 'GET'} ${new URL(url).pathname}`;
    const handler = routes[key];
    if (!handler) throw new Error(`fetch no esperado: ${key}`);
    return handler(init);
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

export function networkDown(): never {
  throw new TypeError('Network request failed');
}

export function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

export function callsTo(fetchMock: jest.Mock, key: string): number {
  return fetchMock.mock.calls.filter(
    ([url, init]: [string, RequestInit | undefined]) =>
      `${init?.method ?? 'GET'} ${new URL(url).pathname}` === key,
  ).length;
}

export async function storeToken(token = TOKEN) {
  await SecureStore.setItemAsync('wod.session-token', token);
}

export function storedToken() {
  return SecureStore.getItemAsync('wod.session-token');
}

export function resetMocks() {
  (SecureStore as unknown as { __reset: () => void }).__reset();
  jest.clearAllMocks();
}
