import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { LOGIN_TITLE, mockFetch, resetMocks } from './helpers';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

async function openWelcome() {
  mockFetch({});
  await renderRouter('src/app', { initialUrl: '/' });
  await screen.findByText('Entrena. Lidera. Evoluciona.');
}

describe('Bienvenida', () => {
  beforeEach(resetMocks);

  it('muestra la identidad de WOD y los dos accesos', async () => {
    await openWelcome();

    expect(screen.getByLabelText('WOD')).toBeOnTheScreen();
    expect(screen.getByRole('header', { name: /Tu método,/ })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Crear cuenta' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeOnTheScreen();
  });

  it('"Crear cuenta" abre el registro y la flecha vuelve a la bienvenida', async () => {
    await openWelcome();

    await fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));
    expect(await screen.findByText('Crea tu perfil')).toBeOnTheScreen();
    expect(screen).toHavePathname('/register');

    await fireEvent.press(screen.getByRole('button', { name: 'Volver a la bienvenida' }));
    expect(await screen.findByText('Entrena. Lidera. Evoluciona.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/welcome');
  });

  it('"Iniciar sesión" abre el login', async () => {
    await openWelcome();

    await fireEvent.press(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByText(LOGIN_TITLE)).toBeOnTheScreen();
    expect(screen).toHavePathname('/login');
  });
});
