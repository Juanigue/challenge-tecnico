import { describe, expect, it } from 'vitest';
import { hashToken } from '../src/auth/sessions.js';
import { login, makeTestApp, register } from './helpers.js';

describe('POST /auth/login', () => {
  it('F-05: login válido devuelve token y guarda solo su SHA-256', async () => {
    const { app, db } = makeTestApp();
    await register(app).expect(201);

    const res = await login(app, '  ANA@example.com').expect(200);

    expect(res.body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(res.body.user.email).toBe('ana@example.com');

    const session = db.prepare('SELECT * FROM sessions').get() as Record<string, unknown>;
    expect(session.token_hash).toBe(hashToken(res.body.token));
    expect(session.token_hash).not.toBe(res.body.token);
    expect(session.revoked_at).toBeNull();
  });

  it('F-05: cada login crea una sesión nueva con un token distinto', async () => {
    const { app } = makeTestApp();
    await register(app).expect(201);

    const first = await login(app).expect(200);
    const second = await login(app).expect(200);

    expect(first.body.token).not.toBe(second.body.token);
  });

  it('F-06: contraseña incorrecta y email inexistente dan el mismo error genérico', async () => {
    const { app, db } = makeTestApp();
    await register(app).expect(201);

    const wrongPassword = await login(app, 'ana@example.com', 'contraseña incorrecta').expect(401);
    const unknownEmail = await login(app, 'nadie@example.com', 'contraseña incorrecta').expect(401);

    expect(wrongPassword.body).toEqual({
      error: { code: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' },
    });
    expect(unknownEmail.body).toEqual(wrongPassword.body);
    expect(db.prepare('SELECT COUNT(*) AS n FROM sessions').get()).toEqual({ n: 0 });
  });
});
