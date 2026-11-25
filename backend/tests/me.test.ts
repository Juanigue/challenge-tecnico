import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { login, makeTestApp, me, register } from './helpers.js';

describe('GET /auth/me', () => {
  it('F-07: el token del login sigue sirviendo en requests posteriores y devuelve session.expiresAt', async () => {
    const { app } = makeTestApp();
    await register(app).expect(201);
    const loginRes = await login(app).expect(200);

    const res = await me(app, loginRes.body.token).expect(200);

    expect(res.body).toEqual({
      user: loginRes.body.user,
      session: { createdAt: expect.any(String), expiresAt: loginRes.body.expiresAt },
    });
    expect(JSON.stringify(res.body)).not.toMatch(/hash|token/i);
  });

  it('F-08: sin header Authorization da 401', async () => {
    const { app } = makeTestApp();
    const res = await me(app).expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it.each([
    ['sin prefijo Bearer', (t: string) => t],
    ['con esquema Basic', (t: string) => `Basic ${t}`],
    ['token truncado', (t: string) => `Bearer ${t.slice(0, 20)}`],
    ['Bearer vacío', () => 'Bearer '],
  ])('F-08: header mal formado (%s) da 401', async (_case, header) => {
    const { app } = makeTestApp();
    await register(app).expect(201);
    const { body } = await login(app).expect(200);

    await me(app).set('Authorization', header(body.token)).expect(401);
  });

  it('F-08: token con formato válido pero inexistente da 401', async () => {
    const { app } = makeTestApp();
    await me(app, randomBytes(32).toString('base64url')).expect(401);
  });

  it('F-08: token vencido da 401', async () => {
    const { app, db } = makeTestApp();
    await register(app).expect(201);
    const { body } = await login(app).expect(200);
    db.prepare('UPDATE sessions SET expires_at = ?').run(Date.now() - 1);

    const res = await me(app, body.token).expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
