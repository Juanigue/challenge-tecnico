import { Redirect } from 'expo-router';

import { useAuth } from '@/auth/auth-context';

// Ruta pública de entrada. Stack.Protected no redirige cuando la URL inicial ya
// es una ruta protegida, así que la decisión se toma acá.
export default function Index() {
  const { state } = useAuth();
  return <Redirect href={state.status === 'signedIn' ? '/home' : '/welcome'} />;
}
