import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/auth-context';
import { request } from '@/lib/api-client';
import {
  callsTo,
  EXPIRES_AT,
  jsonResponse,
  mockFetch,
  networkDown,
  resetMocks,
  storedToken,
  storeToken,
  TOKEN,
  USER,
} from './helpers';

const meOk = () => jsonResponse(200, { user: USER, session: { expiresAt: EXPIRES_AT } });
const unauthorized = () =>
  jsonResponse(401, { error: { code: 'UNAUTHORIZED', message: 'Sesión inválida o expirada' } });

function Probe() {
  const { state, signOut, signOutAll, retry } = useAuth();
  const [error, setError] = useState('');
  return (
    <>
      <Text testID="status">{state.status}</Text>
      <Text testID="error">{error}</Text>
      <Pressable onPress={() => signOut().catch((e: Error) => setError(e.message))}>
        <Text>logout</Text>
      </Pressable>
      <Pressable onPress={() => signOutAll().catch((e: Error) => setError(e.message))}>
        <Text>logout-all</Text>
      </Pressable>
      <Pressable onPress={() => void retry()}>
        <Text>retry</Text>
      </Pressable>
    </>
  );
}

async function renderProvider() {
  await render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

const status = () => screen.getByTestId('status');

describe('AuthProvider', () => {
  beforeEach(resetMocks);

  it('F-08: sin token guardado queda en signedOut y no llama al backend', async () => {
    const fetchMock = mockFetch({});

    await renderProvider();

    await waitFor(() => expect(status()).toHaveTextContent('signedOut'));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-07: con token válido recupera la sesión al reabrir la app', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meOk });

    await renderProvider();

    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
  });

  it('F-08: si /auth/me responde 401 borra el token y queda en signedOut', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': unauthorized });

    await renderProvider();

    await waitFor(() => expect(status()).toHaveTextContent('signedOut'));
    expect(await storedToken()).toBeNull();
  });

  it('F-10: sin conexión al arrancar queda offline, conserva el token y puede reintentar', async () => {
    await storeToken();
    const fetchMock = mockFetch({ 'GET /auth/me': networkDown });

    await renderProvider();
    await waitFor(() => expect(status()).toHaveTextContent('offline'));
    expect(await storedToken()).toBe(TOKEN);

    fetchMock.mockImplementation(async () => meOk());
    await fireEvent.press(screen.getByText('retry'));

    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
  });

  it('F-09: el logout revoca en el backend antes de borrar el token', async () => {
    await storeToken();
    const order: string[] = [];
    mockFetch({
      'GET /auth/me': meOk,
      'POST /auth/logout': () => {
        order.push('revocar en backend');
        return jsonResponse(204);
      },
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementationOnce(async () => {
      order.push('borrar token');
    });

    await renderProvider();
    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
    await fireEvent.press(screen.getByText('logout'));

    await waitFor(() => expect(status()).toHaveTextContent('signedOut'));
    expect(order).toEqual(['revocar en backend', 'borrar token']);
  });

  it('F-09 (sin red): si el logout no llega al backend, la sesión sigue activa y se muestra el error', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meOk, 'POST /auth/logout': networkDown });

    await renderProvider();
    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
    await fireEvent.press(screen.getByText('logout'));

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('No pudimos conectar con el servidor. Revisá tu conexión.'),
    );
    expect(status()).toHaveTextContent('signedIn');
    expect(await storedToken()).toBe(TOKEN);
  });

  it('F-09: si el backend ya consideraba inválida la sesión (401), el logout limpia igual', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meOk, 'POST /auth/logout': unauthorized });

    await renderProvider();
    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
    await fireEvent.press(screen.getByText('logout'));

    await waitFor(() => expect(status()).toHaveTextContent('signedOut'));
    expect(await storedToken()).toBeNull();
  });

  it('S-02: un 401 en cualquier request autenticado borra el token y vuelve al flujo público', async () => {
    await storeToken();
    const fetchMock = mockFetch({ 'GET /auth/me': meOk });

    await renderProvider();
    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));

    fetchMock.mockImplementation(async () => unauthorized());
    await act(async () => {
      await expect(request('/auth/me', { token: TOKEN })).rejects.toMatchObject({ status: 401 });
    });

    await waitFor(() => expect(status()).toHaveTextContent('signedOut'));
    expect(await storedToken()).toBeNull();
  });

  it('S-02: logout-all revoca todas en el backend antes de borrar el token', async () => {
    await storeToken();
    const order: string[] = [];
    mockFetch({
      'GET /auth/me': meOk,
      'POST /auth/logout-all': () => {
        order.push('revocar todas en backend');
        return jsonResponse(204);
      },
    });
    jest.mocked(SecureStore.deleteItemAsync).mockImplementationOnce(async () => {
      order.push('borrar token');
    });

    await renderProvider();
    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
    await fireEvent.press(screen.getByText('logout-all'));

    await waitFor(() => expect(status()).toHaveTextContent('signedOut'));
    expect(order).toEqual(['revocar todas en backend', 'borrar token']);
  });
});

describe('Rotación del token al reabrir la app', () => {
  beforeEach(resetMocks);

  const HOUR = 60 * 60 * 1000;
  const NEW_TOKEN = 'B'.repeat(43);
  const NEW_EXPIRES_AT = new Date(Date.now() + 7 * 24 * HOUR).toISOString();
  // Sesión de 7 días creada hace `ageHours` horas.
  const meWithAge = (ageHours: number) => () => {
    const createdAt = Date.now() - ageHours * HOUR;
    return jsonResponse(200, {
      user: USER,
      session: {
        createdAt: new Date(createdAt).toISOString(),
        expiresAt: new Date(createdAt + 7 * 24 * HOUR).toISOString(),
      },
    });
  };
  const rotateOk = () => jsonResponse(200, { token: NEW_TOKEN, expiresAt: NEW_EXPIRES_AT });

  it('S-02: pasada la mitad de la vida de la sesión rota y guarda el token nuevo', async () => {
    await storeToken();
    const fetchMock = mockFetch({ 'GET /auth/me': meWithAge(100), 'POST /auth/rotate': rotateOk });

    await renderProvider();

    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
    expect(callsTo(fetchMock, 'POST /auth/rotate')).toBe(1);
    expect(await storedToken()).toBe(NEW_TOKEN);
  });

  it('antes de la mitad no rota', async () => {
    await storeToken();
    const fetchMock = mockFetch({ 'GET /auth/me': meWithAge(1) });

    await renderProvider();

    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
    expect(callsTo(fetchMock, 'POST /auth/rotate')).toBe(0);
    expect(await storedToken()).toBe(TOKEN);
  });

  it('F-10: si la rotación falla por red entra igual y conserva el token actual', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meWithAge(100), 'POST /auth/rotate': networkDown });

    await renderProvider();

    await waitFor(() => expect(status()).toHaveTextContent('signedIn'));
    expect(await storedToken()).toBe(TOKEN);
  });

  it('S-02: si la rotación da 401 borra el token y queda en signedOut', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meWithAge(100), 'POST /auth/rotate': unauthorized });

    await renderProvider();

    await waitFor(() => expect(status()).toHaveTextContent('signedOut'));
    expect(await storedToken()).toBeNull();
  });
});
