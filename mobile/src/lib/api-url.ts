import Constants from 'expo-constants';

const BACKEND_PORT = 3000;

// hostUri es la dirección de Metro (por ejemplo "192.168.1.50:8081"): el backend
// corre en la misma máquina, así que Expo Go en el teléfono lo alcanza por esa IP.
export function resolveApiUrl(
  envUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
  hostUri: string | undefined = Constants.expoConfig?.hostUri,
): string {
  if (envUrl) return envUrl.replace(/\/+$/, '');
  const host = hostUri?.split(':')[0] || 'localhost';
  return `http://${host}:${BACKEND_PORT}`;
}

export const API_URL = resolveApiUrl();
