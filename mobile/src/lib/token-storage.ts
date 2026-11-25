import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'wod.session-token';

// No entra en backups ni se migra a otro dispositivo.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY, OPTIONS);
}

export function saveToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token, OPTIONS);
}

export function deleteToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY, OPTIONS);
}
