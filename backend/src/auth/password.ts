import { randomBytes } from 'node:crypto';
import { Algorithm, hash, hashSync, verify, type Options } from '@node-rs/argon2';

// Mínimo recomendado por OWASP para Argon2id.
export const ARGON2_OPTIONS: Options = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

// Se verifica contra este hash cuando el email no existe, para que el login
// tarde lo mismo y no revele qué cuentas existen. Mismos parámetros que el real.
const DUMMY_HASH = hashSync(randomBytes(32).toString('hex'), ARGON2_OPTIONS);

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password, ARGON2_OPTIONS);
}

export async function verifyAgainstDummy(password: string): Promise<void> {
  await verify(DUMMY_HASH, password, ARGON2_OPTIONS);
}
