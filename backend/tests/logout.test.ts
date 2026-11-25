import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { login, makeTestApp, me, registerAndLogin } from './helpers.js';

function logout(app: ReturnType<typeof makeTestApp>['app'], token: string) {
  return request(app).post('/auth/logout').set('Authorization', `Bearer ${token}`);
}

describe('POST /auth/logout', () => {
  it('F-09: después del logout, /auth/me con el mismo token da 401', async () => {
    const { app } = makeTestApp();
    const token = await registerAndLogin(app);
    await me(app, token).expect(200);

    await logout(app, token).expect(204);

    await me(app, token).expect(401);
  });

  it('S-02: un token revocado devuelve 401 y queda marcado en la BD', async () => {
    const { app, db } = makeTestApp();
    const token = await registerAndLogin(app);

    await logout(app, token).expect(204);

    const session = db.prepare('SELECT revoked_at FROM sessions').get() as { revoked_at: number | null };
    expect(session.revoked_at).toEqual(expect.any(Number));

    const res = await me(app, token).expect(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    await logout(app, token).expect(401);
  });

  it('S-02: revocar una sesión no afecta a otra sesión del mismo usuario', async () => {
    const { app } = makeTestApp();
    const first = await registerAndLogin(app);
    const { body } = await login(app).expect(200);

    await logout(app, first).expect(204);

    await me(app, first).expect(401);
    await me(app, body.token).expect(200);
  });

  it('S-02: logout sin token da 401', async () => {
    const { app } = makeTestApp();
    await request(app).post('/auth/logout').expect(401);
  });
});
