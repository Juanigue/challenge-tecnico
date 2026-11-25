// El keychain no existe en Node: SecureStore se reemplaza por un Map en memoria.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      store.delete(key);
    }),
    __reset: () => store.clear(),
  };
});

// El blur nativo no existe en Node; alcanza con una View para verificar cuándo se usa.
jest.mock('expo-blur', () => {
  const { View } = require('react-native');
  return { BlurView: View };
});
