import { ApiError } from '@/lib/api-client';
import { getToken } from '@/lib/token-storage';

// Para las pantallas privadas: lee el token de SecureStore y lo pasa al request.
export async function withToken<T>(call: (token: string) => Promise<T>): Promise<T> {
  const token = await getToken();
  if (!token) throw new ApiError('http', 'Tu sesión terminó. Ingresá de nuevo.', 401);
  return call(token);
}
