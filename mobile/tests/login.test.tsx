import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import {
  callsTo,
  deferred,
  EMAIL_LABEL,
  EXPIRES_AT,
  HOME_GREETING,
  jsonResponse,
  LOGIN_BUTTON,
  LOGIN_TITLE,
  mockFetch,
  networkDown,
  resetMocks,
  storedToken,
  TOKEN,
  USER,
} from './helpers';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

const loginOk = () => jsonResponse(200, { token: TOKEN, expiresAt: EXPIRES_AT, user: USER });

async function openLogin() {
  await renderRouter('src/app', { initialUrl: '/login' });
  await screen.findByText(LOGIN_TITLE);
}

async function fillAndSubmit(email: string, password: string) {
  await fireEvent.changeText(screen.getByLabelText(EMAIL_LABEL), email);
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password);
  await fireEvent.press(screen.getByRole('button', { name: LOGIN_BUTTON }));
}

describe('Pantalla de login', () => {
  beforeEach(resetMocks);

  it('F-05: login válido guarda el token en SecureStore y entra a Home', async () => {
    const fetchMock = mockFetch({ 'POST /auth/login': loginOk });
    await openLogin();

    await fillAndSubmit('  ANA@example.com ', 'correct horse battery');

    expect(await screen.findByText(HOME_GREETING)).toBeOnTheScreen();
    expect(screen).toHavePathname('/home');
    expect(await storedToken()).toBe(TOKEN);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ email: 'ana@example.com', password: 'correct horse battery' });
  });

  it('F-05: viniendo del registro muestra el aviso, precarga el email y el login lleva a Home', async () => {
    mockFetch({ 'POST /auth/login': loginOk });
    await renderRouter('src/app', { initialUrl: '/login?email=ana%40example.com&registered=1' });

    expect(await screen.findByText('Cuenta creada. Ingresá con tu contraseña.')).toBeOnTheScreen();
    expect(screen.getByLabelText(EMAIL_LABEL)).toHaveDisplayValue('ana@example.com');

    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'correct horse battery');
    await fireEvent.press(screen.getByRole('button', { name: LOGIN_BUTTON }));

    expect(await screen.findByText(HOME_GREETING)).toBeOnTheScreen();
    expect(await storedToken()).toBe(TOKEN);
  });

  it('F-05: sin venir del registro no muestra el aviso de cuenta creada', async () => {
    mockFetch({});
    await openLogin();
    expect(screen.queryByText('Cuenta creada. Ingresá con tu contraseña.')).toBeNull();
  });

  it('F-05: el ojo muestra y oculta la contraseña', async () => {
    mockFetch({});
    await openLogin();
    const password = screen.getByLabelText('Contraseña');

    expect(password).toHaveProp('secureTextEntry', true);
    await fireEvent.press(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', false);
    await fireEvent.press(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(screen.getByLabelText('Contraseña')).toHaveProp('secureTextEntry', true);
  });

  it('F-06: credenciales inválidas muestran el error genérico del backend y no guardan nada', async () => {
    mockFetch({
      'POST /auth/login': () =>
        jsonResponse(401, { error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' } }),
    });
    await openLogin();

    await fillAndSubmit('ana@example.com', 'contraseña incorrecta');

    expect(await screen.findByText('Email o contraseña incorrectos')).toBeOnTheScreen();
    expect(screen).toHavePathname('/login');
    expect(await storedToken()).toBeNull();
  });

  it('F-06: email inválido o contraseña vacía bloquean el envío', async () => {
    const fetchMock = mockFetch({});
    await openLogin();

    await fillAndSubmit('no-es-un-email', '');

    expect(screen.getByText('El email no es válido')).toBeOnTheScreen();
    expect(screen.getByText('La contraseña es obligatoria')).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-10: backend apagado muestra un error de red controlado', async () => {
    mockFetch({ 'POST /auth/login': networkDown });
    await openLogin();

    await fillAndSubmit('ana@example.com', 'correct horse battery');

    expect(
      await screen.findByText('No pudimos conectar con el servidor. Revisá tu conexión.'),
    ).toBeOnTheScreen();
    expect(screen).toHavePathname('/login');
  });

  it('F-11: doble toque en "Entrar a WOD" hace un solo request y muestra la carga', async () => {
    const pending = deferred<Response>();
    const fetchMock = mockFetch({ 'POST /auth/login': () => pending.promise });
    await openLogin();
    await fireEvent.changeText(screen.getByLabelText(EMAIL_LABEL), 'ana@example.com');
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'correct horse battery');

    const button = screen.getByRole('button', { name: LOGIN_BUTTON });
    await fireEvent.press(button);
    await fireEvent.press(button);
    expect(button).toBeDisabled();
    expect(screen.getByText('Validando tus credenciales de forma segura…')).toBeOnTheScreen();
    await act(async () => pending.resolve(loginOk()));

    expect(await screen.findByText(HOME_GREETING)).toBeOnTheScreen();
    expect(callsTo(fetchMock, 'POST /auth/login')).toBe(1);
  });
});
