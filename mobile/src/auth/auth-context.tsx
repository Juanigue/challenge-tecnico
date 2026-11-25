import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

import { ApiError, setUnauthorizedHandler } from '@/lib/api-client';
import { deleteToken, getToken, saveToken } from '@/lib/token-storage';
import * as authApi from './auth-api';
import type { PublicUser } from './auth-api';
import type { LoginInput, RegisterInput } from './schemas';

export type AuthState =
  | { status: 'loading' }
  // Hay token pero no se pudo verificar contra el backend: no se muestra nada privado.
  | { status: 'offline' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: PublicUser; expiresAt: string };

interface AuthContextValue {
  state: AuthState;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
  setUser: (user: PublicUser) => void;
  retry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Se rota el token cuando ya pasó la mitad de su vida: una sesión robada vieja deja
// de servir antes, y el usuario activo nunca llega al vencimiento.
export function shouldRotate(session: { createdAt?: string; expiresAt: string }, now = Date.now()): boolean {
  const createdAt = Date.parse(session.createdAt ?? '');
  const expiresAt = Date.parse(session.expiresAt);
  if (Number.isNaN(createdAt) || Number.isNaN(expiresAt)) return false;
  return now >= createdAt + (expiresAt - createdAt) / 2;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' });

  const clearLocalSession = useCallback(async () => {
    await deleteToken();
    setState({ status: 'signedOut' });
  }, []);

  const restoreSession = useCallback(async () => {
    setState({ status: 'loading' });
    const token = await getToken();
    if (!token) {
      setState({ status: 'signedOut' });
      return;
    }

    try {
      const { user, session } = await authApi.me(token);
      let { expiresAt } = session;
      if (shouldRotate(session)) {
        try {
          const rotated = await authApi.rotate(token);
          await saveToken(rotated.token);
          expiresAt = rotated.expiresAt;
        } catch (err) {
          // Sin red el token actual sigue siendo válido; un 401 sí corta la sesión.
          if (err instanceof ApiError && err.status === 401) throw err;
        }
      }
      setState({ status: 'signedIn', user, expiresAt });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        await clearLocalSession();
      } else {
        // Sin red o error del servidor: se conserva el token para reintentar.
        setState({ status: 'offline' });
      }
    }
  }, [clearLocalSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => void clearLocalSession());
    void restoreSession();
    return () => setUnauthorizedHandler(null);
  }, [clearLocalSession, restoreSession]);

  const signIn = useCallback(async (input: LoginInput) => {
    const { token, user, expiresAt } = await authApi.login(input);
    await saveToken(token);
    setState({ status: 'signedIn', user, expiresAt });
  }, []);

  // Solo crea la cuenta: la sesión se crea únicamente con un login explícito.
  const signUp = useCallback(async (input: RegisterInput) => {
    await authApi.register(input);
  }, []);

  // Primero se revoca en el backend. Si no hay red, la sesión sigue activa y el
  // error sube a la pantalla para que el usuario reintente.
  const revokeThenClear = useCallback(
    async (revoke: (token: string) => Promise<void>) => {
      const token = await getToken();
      if (token) {
        try {
          await revoke(token);
        } catch (err) {
          const alreadyInvalid = err instanceof ApiError && err.status === 401;
          if (!alreadyInvalid) throw err;
        }
      }
      await clearLocalSession();
    },
    [clearLocalSession],
  );

  const signOut = useCallback(() => revokeThenClear(authApi.logout), [revokeThenClear]);
  const signOutAll = useCallback(() => revokeThenClear(authApi.logoutAll), [revokeThenClear]);

  const setUser = useCallback((user: PublicUser) => {
    setState((current) => (current.status === 'signedIn' ? { ...current, user } : current));
  }, []);

  return (
    <AuthContext.Provider value={{ state, signIn, signUp, signOut, signOutAll, setUser, retry: restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
