import { renderRouter, screen, within } from 'expo-router/testing-library';

import { EXPIRES_AT, HOME_GREETING, jsonResponse, mockFetch, resetMocks, storeToken, USER } from './helpers';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

describe('Home', () => {
  beforeEach(resetMocks);

  it('muestra saludo, nombre, email, estado de sesión y tarjetas demo identificadas', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': () => jsonResponse(200, { user: USER, session: { expiresAt: EXPIRES_AT } }) });

    await renderRouter('src/app', { initialUrl: '/' });

    expect(await screen.findByText(HOME_GREETING)).toBeOnTheScreen();
    expect(screen.getAllByText('Ana García').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ana@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Tu sesión')).toBeOnTheScreen();
    expect(screen.getByText('Activa')).toBeOnTheScreen();
    expect(screen.getByText(`Vence: ${new Date(EXPIRES_AT).toLocaleString('es-AR')}`)).toBeOnTheScreen();
    expect(screen.getByText('AG')).toBeOnTheScreen();

    expect(screen.getByText('Mis alumnos')).toBeOnTheScreen();
    expect(screen.getByText('Rutinas')).toBeOnTheScreen();
    expect(screen.getAllByText('Demo')).toHaveLength(2);
    expect(screen.getByText('Mi perfil')).toBeOnTheScreen();
    expect(within(screen.getByRole('button', { name: 'Cerrar sesión' })).getByText('Cerrar sesión')).toBeOnTheScreen();
  });
});
