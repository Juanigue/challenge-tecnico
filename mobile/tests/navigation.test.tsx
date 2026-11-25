import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import {
  deferred,
  EXPIRES_AT,
  jsonResponse,
  mockFetch,
  networkDown,
  resetMocks,
  storedToken,
  storeToken,
  USER,
} from './helpers';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

const meOk = () => jsonResponse(200, { user: USER, session: { expiresAt: EXPIRES_AT } });

function renderApp(initialUrl = '/') {
  return renderRouter('src/app', { initialUrl });
}

describe('Navegación protegida', () => {
  beforeEach(resetMocks);

  it('F-08: sin sesión, la ruta privada redirige al login', async () => {
    mockFetch({});

    await renderApp('/');

    expect(await screen.findByText('Ingresar a WOD')).toBeOnTheScreen();
    expect(screen).toHavePathname('/login');
    expect(screen.queryByText(/Hola,/)).toBeNull();
  });

  it('F-07: el splash sigue visible hasta que /auth/me responde y después se ve Home', async () => {
    await storeToken();
    const pendingMe = deferred<Response>();
    mockFetch({ 'GET /auth/me': () => pendingMe.promise });

    await renderApp('/');

    expect(SplashScreen.hideAsync).not.toHaveBeenCalled();
    expect(screen.queryByText(/Hola,/)).toBeNull();
    expect(screen.queryByText('Ingresar a WOD')).toBeNull();

    await act(async () => pendingMe.resolve(meOk()));

    expect(await screen.findByText('Hola, Ana')).toBeOnTheScreen();
    expect(SplashScreen.hideAsync).toHaveBeenCalled();
    expect(screen).toHavePathname('/home');
  });

  it('F-09: después del logout se ve el login y no se puede volver atrás a Home', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meOk, 'POST /auth/logout': () => jsonResponse(204) });

    await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByText('Ingresar a WOD')).toBeOnTheScreen();
    expect(screen).toHavePathname('/login');
    expect(await storedToken()).toBeNull();

    expect(router.canGoBack()).toBe(false);
    await act(async () => router.push('/home'));
    expect(screen.queryByText(/Hola,/)).toBeNull();
    await act(async () => router.push('/'));
    expect(screen).toHavePathname('/login');
    expect(screen.queryByText(/Hola,/)).toBeNull();
  });

  it('F-08: con la app abierta sin sesión, navegar a /home no muestra contenido privado', async () => {
    mockFetch({});

    await renderApp('/login');
    await act(async () => router.push('/home'));

    expect(screen.queryByText(/Hola,/)).toBeNull();
  });

  it('F-09 (sin red): si el logout falla, sigue en Home con el error visible', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meOk, 'POST /auth/logout': networkDown });

    await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'Cerrar sesión' }));

    expect(
      await screen.findByText('No pudimos conectar con el servidor. Revisá tu conexión.'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Hola, Ana')).toBeOnTheScreen();
  });

  it('F-10: backend apagado al abrir la app muestra la pantalla sin conexión y permite reintentar', async () => {
    await storeToken();
    const fetchMock = mockFetch({ 'GET /auth/me': networkDown });

    await renderApp('/');

    expect(await screen.findByText('No pudimos conectar con el servidor')).toBeOnTheScreen();
    expect(screen.queryByText(/Hola,/)).toBeNull();

    fetchMock.mockImplementation(async () => meOk());
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));

    await waitFor(() => expect(screen.getByText('Hola, Ana')).toBeOnTheScreen());
  });
});
