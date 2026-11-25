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
  retry: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

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
      setState({ status: 'signedIn', user, expiresAt: session.expiresAt });
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
  const signOut = useCallback(async () => {
    const token = await getToken();
    if (token) {
      try {
        await authApi.logout(token);
      } catch (err) {
        const alreadyInvalid = err instanceof ApiError && err.status === 401;
        if (!alreadyInvalid) throw err;
      }
    }
    await clearLocalSession();
  }, [clearLocalSession]);

  return (
    <AuthContext.Provider value={{ state, signIn, signUp, signOut, retry: restoreSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return value;
}
