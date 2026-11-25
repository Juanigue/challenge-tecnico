import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import {
  callsTo,
  deferred,
  EMAIL_LABEL,
  EXPIRES_AT,
  HOME_GREETING,
  jsonResponse,
  LOGIN_TITLE,
  mockFetch,
  resetMocks,
  storedToken,
  storeToken,
  USER,
} from './helpers';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

const PASSWORD = 'correct horse battery';
const meAs = (user: typeof USER) => () => jsonResponse(200, { user, session: { expiresAt: EXPIRES_AT } });

describe('Recuperación de contraseña', () => {
  beforeEach(resetMocks);

  async function goToResetStep() {
    await renderRouter('src/app', { initialUrl: '/login' });
    await screen.findByText(LOGIN_TITLE);
    await fireEvent.press(screen.getByText('¿Olvidaste tu contraseña?'));
    await screen.findByText('Olvidé mi contraseña');
    await fireEvent.changeText(screen.getByLabelText(EMAIL_LABEL), ' ANA@example.com ');
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar código' }));
    await screen.findByText('Restablecer contraseña');
  }

  async function fillReset(code: string, password: string, confirm: string) {
    await fireEvent.changeText(screen.getByLabelText('Código'), code);
    await fireEvent.changeText(screen.getByLabelText('Contraseña nueva'), password);
    await fireEvent.changeText(screen.getByLabelText('Confirmar contraseña'), confirm);
    await fireEvent.press(screen.getByRole('button', { name: 'Cambiar contraseña' }));
  }

  it('pide el código, cambia la contraseña y vuelve al login con aviso', async () => {
    const fetchMock = mockFetch({
      'POST /auth/password/forgot': () => jsonResponse(202, { message: 'ok' }),
      'POST /auth/password/reset': () => jsonResponse(204),
    });
    await goToResetStep();

    await fillReset('123456', PASSWORD, PASSWORD);

    expect(await screen.findByText('Contraseña actualizada. Ingresá con la nueva.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/login');
    expect(screen.getByLabelText(EMAIL_LABEL)).toHaveDisplayValue('ana@example.com');
    const resetCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/password/reset'));
    expect(JSON.parse(resetCall[1].body)).toEqual({
      email: 'ana@example.com',
      code: '123456',
      password: PASSWORD,
      confirmPassword: PASSWORD,
    });
  });

  it('muestra el error del backend si el código es inválido o venció', async () => {
    mockFetch({
      'POST /auth/password/forgot': () => jsonResponse(202, { message: 'ok' }),
      'POST /auth/password/reset': () =>
        jsonResponse(400, { error: { code: 'INVALID_CODE', message: 'Código inválido o vencido' } }),
    });
    await goToResetStep();

    await fillReset('000000', PASSWORD, PASSWORD);

    expect(await screen.findByText('Código inválido o vencido')).toBeOnTheScreen();
    expect(screen).toHavePathname('/forgot-password');
  });

  it('F-03: contraseñas distintas o cortas no llegan al backend', async () => {
    const fetchMock = mockFetch({ 'POST /auth/password/forgot': () => jsonResponse(202, { message: 'ok' }) });
    await goToResetStep();

    await fillReset('123456', 'corta', 'corta');
    expect(await screen.findByText('La contraseña debe tener al menos 12 caracteres')).toBeOnTheScreen();

    await fillReset('123456', PASSWORD, `${PASSWORD}!`);
    expect(await screen.findByText('Las contraseñas no coinciden')).toBeOnTheScreen();

    expect(callsTo(fetchMock, 'POST /auth/password/reset')).toBe(0);
  });

  it('F-11: el doble toque en "Enviar código" manda un solo request', async () => {
    const pending = deferred<Response>();
    const fetchMock = mockFetch({ 'POST /auth/password/forgot': () => pending.promise });
    await renderRouter('src/app', { initialUrl: '/forgot-password' });
    await screen.findByText('Olvidé mi contraseña');
    await fireEvent.changeText(screen.getByLabelText(EMAIL_LABEL), 'ana@example.com');

    const button = screen.getByRole('button', { name: 'Enviar código' });
    await fireEvent.press(button);
    await fireEvent.press(button);
    pending.resolve(jsonResponse(202, { message: 'ok' }));

    await screen.findByText('Restablecer contraseña');
    expect(callsTo(fetchMock, 'POST /auth/password/forgot')).toBe(1);
  });
});

describe('Verificación de email', () => {
  beforeEach(resetMocks);

  it('Home avisa que falta verificar; con el código correcto el aviso desaparece', async () => {
    await storeToken();
    const fetchMock = mockFetch({
      'GET /auth/me': meAs({ ...USER, emailVerified: false }),
      'POST /auth/email/verify': () => jsonResponse(200, { user: USER }),
    });
    await renderRouter('src/app', { initialUrl: '/' });
    await screen.findByText(HOME_GREETING);

    await fireEvent.press(screen.getByRole('button', { name: 'Ingresar código' }));
    await screen.findByText('Verificá tu email', { exact: true });
    await fireEvent.changeText(screen.getByLabelText('Código'), '654321');
    await fireEvent.press(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText(HOME_GREETING)).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Ingresar código' })).toBeNull();
    const verifyCall = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/auth/email/verify'));
    expect(JSON.parse(verifyCall[1].body)).toEqual({ code: '654321' });
  });

  it('con email verificado Home no muestra el aviso', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meAs(USER) });
    await renderRouter('src/app', { initialUrl: '/' });
    await screen.findByText(HOME_GREETING);

    expect(screen.queryByRole('button', { name: 'Ingresar código' })).toBeNull();
  });

  it('un código con formato inválido no llega al backend', async () => {
    await storeToken();
    const fetchMock = mockFetch({ 'GET /auth/me': meAs({ ...USER, emailVerified: false }) });
    await renderRouter('src/app', { initialUrl: '/verify-email' });
    await screen.findByLabelText('Código');

    await fireEvent.changeText(screen.getByLabelText('Código'), '12ab');
    await fireEvent.press(screen.getByRole('button', { name: 'Verificar' }));

    expect(await screen.findByText('El código tiene 6 dígitos')).toBeOnTheScreen();
    expect(callsTo(fetchMock, 'POST /auth/email/verify')).toBe(0);
  });
});

describe('Edición de perfil', () => {
  beforeEach(resetMocks);

  it('guarda nombre y apellido y Home muestra el nombre nuevo', async () => {
    await storeToken();
    const fetchMock = mockFetch({
      'GET /auth/me': meAs(USER),
      'PATCH /auth/me': () => jsonResponse(200, { user: { ...USER, firstName: 'Anabel' } }),
    });
    await renderRouter('src/app', { initialUrl: '/' });
    await screen.findByText(HOME_GREETING);

    await fireEvent.press(screen.getByRole('link', { name: 'Editar perfil' }));
    await screen.findByLabelText('Nombre');
    await fireEvent.changeText(screen.getByLabelText('Nombre'), ' Anabel ');
    await fireEvent.press(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Perfil actualizado.')).toBeOnTheScreen();
    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(JSON.parse(patchCall[1].body)).toEqual({ firstName: 'Anabel', lastName: 'García' });

    await fireEvent.press(screen.getByRole('button', { name: 'Volver al inicio' }));
    expect(await screen.findByText(/, Anabel\.$/)).toBeOnTheScreen();
  });

  it('sin cambios el botón queda deshabilitado', async () => {
    await storeToken();
    mockFetch({ 'GET /auth/me': meAs(USER) });
    await renderRouter('src/app', { initialUrl: '/profile' });
    await screen.findByLabelText('Nombre');

    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled();
  });
});

describe('Sesiones abiertas', () => {
  beforeEach(resetMocks);

  const sessionsList = () =>
    jsonResponse(200, {
      sessions: [
        { id: 1, device: 'WOD iOS (iPhone 15)', createdAt: EXPIRES_AT, lastUsedAt: EXPIRES_AT, expiresAt: EXPIRES_AT, current: true },
        { id: 2, device: 'WOD android (Pixel 8)', createdAt: EXPIRES_AT, lastUsedAt: EXPIRES_AT, expiresAt: EXPIRES_AT, current: false },
      ],
    });

  async function openSessions(routes: Parameters<typeof mockFetch>[0]) {
    await storeToken();
    const fetchMock = mockFetch({ 'GET /auth/me': meAs(USER), 'GET /auth/sessions': sessionsList, ...routes });
    await renderRouter('src/app', { initialUrl: '/sessions' });
    await screen.findByText('WOD android (Pixel 8)');
    return fetchMock;
  }

  it('lista las sesiones, marca la actual y revoca otra', async () => {
    const fetchMock = await openSessions({ 'DELETE /auth/sessions/2': () => jsonResponse(204) });

    expect(screen.getByText('Este dispositivo')).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Cerrar sesión en WOD ios (iPhone 15)' })).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión en WOD android (Pixel 8)' }));

    expect(await screen.findByText('WOD iOS (iPhone 15)')).toBeOnTheScreen();
    expect(screen.queryByText('WOD android (Pixel 8)')).toBeNull();
    expect(callsTo(fetchMock, 'DELETE /auth/sessions/2')).toBe(1);
  });

  it('F-09: cerrar todas revoca en el backend, borra el token y vuelve al login', async () => {
    const fetchMock = await openSessions({ 'POST /auth/logout-all': () => jsonResponse(204) });

    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar sesión en todos los dispositivos' }));

    expect(await screen.findByText(LOGIN_TITLE)).toBeOnTheScreen();
    expect(callsTo(fetchMock, 'POST /auth/logout-all')).toBe(1);
    expect(await storedToken()).toBeNull();
  });
});
