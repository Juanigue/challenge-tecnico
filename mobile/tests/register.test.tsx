import { router } from 'expo-router';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { callsTo, deferred, jsonResponse, mockFetch, resetMocks, storedToken, USER } from './helpers';

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(async () => true),
  hideAsync: jest.fn(async () => true),
}));

const PASSWORD = 'correct horse battery';
const registerOk = () => jsonResponse(201, { user: USER });

async function openRegister() {
  await renderRouter('src/app', { initialUrl: '/register' });
  await screen.findByText('Crear cuenta de entrenador');
}

async function fillForm(overrides: Partial<Record<string, string>> = {}, acceptTerms = true) {
  const values = {
    Nombre: 'Ana',
    Apellido: 'García',
    Email: 'ana@example.com',
    Contraseña: PASSWORD,
    'Repetir contraseña': PASSWORD,
    ...overrides,
  };
  for (const [label, value] of Object.entries(values)) {
    await fireEvent.changeText(screen.getByLabelText(label), value ?? '');
  }
  if (acceptTerms) {
    await fireEvent(screen.getByLabelText('Acepto los términos y condiciones'), 'valueChange', true);
  }
}

const submit = () => fireEvent.press(screen.getByRole('button', { name: 'Crear cuenta' }));

describe('Pantalla de registro', () => {
  beforeEach(resetMocks);

  it('F-01: registro válido crea la cuenta y lleva al login con aviso y email precargado, sin crear sesión', async () => {
    const fetchMock = mockFetch({ 'POST /auth/register': registerOk });
    await openRegister();

    await fillForm({ Email: '  ANA@example.com ' });
    await submit();

    expect(await screen.findByText('Cuenta creada. Ingresá con tu contraseña.')).toBeOnTheScreen();
    expect(screen).toHavePathname('/login');
    expect(screen.getByLabelText('Email')).toHaveDisplayValue('ana@example.com');
    expect(callsTo(fetchMock, 'POST /auth/login')).toBe(0);
    expect(await storedToken()).toBeNull();
    const [, registerInit] = fetchMock.mock.calls[0];
    expect(JSON.parse(registerInit.body)).toEqual({
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@example.com',
      password: PASSWORD,
      confirmPassword: PASSWORD,
      acceptTerms: true,
    });
  });

  it('F-02: email ya registrado (409) muestra el error en el campo email', async () => {
    mockFetch({
      'POST /auth/register': () =>
        jsonResponse(409, { error: { code: 'EMAIL_TAKEN', message: 'Ya existe una cuenta con ese email' } }),
    });
    await openRegister();

    await fillForm();
    await submit();

    expect(await screen.findByText('Ya existe una cuenta con ese email')).toBeOnTheScreen();
    expect(await storedToken()).toBeNull();
  });

  it('F-02: email inválido bloquea el envío', async () => {
    const fetchMock = mockFetch({});
    await openRegister();

    await fillForm({ Email: 'no-es-un-email' });
    await submit();

    expect(screen.getByText('El email no es válido')).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-03: contraseñas distintas bloquean el envío', async () => {
    const fetchMock = mockFetch({});
    await openRegister();

    await fillForm({ 'Repetir contraseña': 'otra contraseña larga' });
    await submit();

    expect(screen.getByText('Las contraseñas no coinciden')).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-03: contraseña de menos de 12 caracteres bloquea el envío', async () => {
    const fetchMock = mockFetch({});
    await openRegister();

    await fillForm({ Contraseña: 'corta123', 'Repetir contraseña': 'corta123' });
    await submit();

    expect(screen.getByText('La contraseña debe tener al menos 12 caracteres')).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-04: sin aceptar los términos no se envía el registro', async () => {
    const fetchMock = mockFetch({});
    await openRegister();

    await fillForm({}, false);
    await submit();

    expect(screen.getByText('Tenés que aceptar los términos')).toBeOnTheScreen();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('F-11: doble toque en "Crear cuenta" hace un solo registro', async () => {
    const pending = deferred<Response>();
    const fetchMock = mockFetch({ 'POST /auth/register': () => pending.promise });
    await openRegister();
    await fillForm();

    const button = screen.getByRole('button', { name: 'Crear cuenta' });
    await fireEvent.press(button);
    await fireEvent.press(button);
    expect(button).toBeDisabled();
    await act(async () => pending.resolve(registerOk()));

    expect(await screen.findByText('Cuenta creada. Ingresá con tu contraseña.')).toBeOnTheScreen();
    expect(callsTo(fetchMock, 'POST /auth/register')).toBe(1);
  });

  it('F-01: después de registrarse, "atrás" no vuelve al formulario enviado', async () => {
    mockFetch({ 'POST /auth/register': registerOk });
    await openRegister();

    await fillForm();
    await submit();

    expect(await screen.findByText('Cuenta creada. Ingresá con tu contraseña.')).toBeOnTheScreen();
    expect(router.canGoBack()).toBe(false);
  });
});
