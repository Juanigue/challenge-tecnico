import { describe, expect, it } from 'vitest';
import { login, makeTestApp, register } from './helpers.js';

const RATE_LIMITED = {
  error: { code: 'RATE_LIMITED', message: 'Demasiados intentos. Probá de nuevo más tarde.' },
};

describe('Rate limiting', () => {
  it('S-03: login por IP responde 429 al superar el límite', async () => {
    const { app } = makeTestApp({ RATE_LIMIT_LOGIN_IP_PER_15MIN: '3' });

    for (let i = 0; i < 3; i++) {
      await login(app, `user${i}@example.com`, 'contraseña incorrecta').expect(401);
    }
    const res = await login(app, 'otro@example.com', 'contraseña incorrecta').expect(429);

    expect(res.body).toEqual(RATE_LIMITED);
  });

  it('S-03: login por email cuenta los fallidos y bloquea aunque cambie la escritura del email', async () => {
    const { app } = makeTestApp({ RATE_LIMIT_LOGIN_EMAIL_PER_15MIN: '3' });
    await register(app).expect(201);

    await login(app, 'ana@example.com', 'contraseña incorrecta').expect(401);
    await login(app, 'ANA@example.com', 'contraseña incorrecta').expect(401);
    await login(app, ' ana@EXAMPLE.com ', 'contraseña incorrecta').expect(401);

    // Bloqueado incluso con la contraseña correcta, y otros emails siguen funcionando.
    await login(app).expect(429);
    await login(app, 'otro@example.com', 'contraseña incorrecta').expect(401);
  });

  it('S-03: un email inexistente llega al 429 en el mismo intento y con el mismo body que uno existente', async () => {
    const { app } = makeTestApp({ RATE_LIMIT_LOGIN_EMAIL_PER_15MIN: '2' });
    await register(app).expect(201);

    const statuses = async (email: string) => {
      const result: number[] = [];
      for (let i = 0; i < 3; i++) {
        result.push((await login(app, email, 'contraseña incorrecta')).status);
      }
      return result;
    };

    expect(await statuses('ana@example.com')).toEqual([401, 401, 429]);
    expect(await statuses('nadie@example.com')).toEqual([401, 401, 429]);

    const existing = await login(app, 'ana@example.com', 'x');
    const missing = await login(app, 'nadie@example.com', 'x');
    expect(existing.body).toEqual(RATE_LIMITED);
    expect(missing.body).toEqual(existing.body);
  });

  it('S-03: los logins exitosos no consumen el límite por email', async () => {
    const { app } = makeTestApp({ RATE_LIMIT_LOGIN_EMAIL_PER_15MIN: '2' });
    await register(app).expect(201);

    for (let i = 0; i < 4; i++) {
      await login(app).expect(200);
    }
  });

  it('S-03: el registro responde 429 al superar el límite por IP', async () => {
    const { app } = makeTestApp({ RATE_LIMIT_REGISTER_PER_HOUR: '2' });

    await register(app, { email: 'a@example.com' }).expect(201);
    await register(app, { email: 'b@example.com' }).expect(201);
    const res = await register(app, { email: 'c@example.com' }).expect(429);

    expect(res.body).toEqual(RATE_LIMITED);
  });
});
