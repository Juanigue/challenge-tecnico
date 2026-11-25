import * as SecureStore from 'expo-secure-store';

import { login, me } from '@/auth/auth-api';
import { deleteToken, getToken, saveToken } from '@/lib/token-storage';
import { EXPIRES_AT, jsonResponse, mockFetch, resetMocks, TOKEN, USER } from './helpers';

const packageJson = require('../package.json') as {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
};

describe('Almacenamiento del token', () => {
  beforeEach(resetMocks);

  it('S-04: el token se guarda solo en SecureStore, sin backup ni migración a otro dispositivo', async () => {
    await saveToken(TOKEN);

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('wod.session-token', TOKEN, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    expect(await getToken()).toBe(TOKEN);

    await deleteToken();
    expect(await getToken()).toBeNull();
  });

  it('S-04: AsyncStorage no es dependencia del proyecto', () => {
    const allDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    expect(Object.keys(allDependencies)).not.toContain('@react-native-async-storage/async-storage');
  });

  it('S-04: ningún console.* imprime el token ni la contraseña durante login y /auth/me', async () => {
    const printed: string[] = [];
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map((method) =>
      jest.spyOn(console, method).mockImplementation((...args: unknown[]) => {
        printed.push(args.map(String).join(' '));
      }),
    );
    mockFetch({
      'POST /auth/login': () => jsonResponse(200, { token: TOKEN, expiresAt: EXPIRES_AT, user: USER }),
      'GET /auth/me': () => jsonResponse(200, { user: USER, session: { expiresAt: EXPIRES_AT } }),
    });

    const { token } = await login({ email: 'ana@example.com', password: 'correct horse battery' });
    await saveToken(token);
    await me(token);

    spies.forEach((spy) => spy.mockRestore());
    const output = printed.join('\n');
    expect(output).not.toContain(TOKEN);
    expect(output).not.toContain('correct horse battery');
  });
});
