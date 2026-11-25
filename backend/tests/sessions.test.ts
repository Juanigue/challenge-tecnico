import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { login, makeTestApp, me, register, registerAndLogin } from './helpers.js';

type App = ReturnType<typeof makeTestApp>['app'];

const authed = (token: string) => ({ Authorization: `Bearer ${token}` });
const listSessions = (app: App, token: string) => request(app).get('/auth/sessions').set(authed(token));

describe('Sesiones múltiples', () => {
  it('GET /auth/sessions lista solo las activas del usuario y marca la actual', async () => {
    const { app } = makeTestApp();
    await register(app).expect(201);
    const phone = (await login(app).set('User-Agent', 'WOD iOS (iPhone 15)').expect(200)).body.token;
    const tablet = (await login(app).set('User-Agent', 'WOD Android (Pixel)').expect(200)).body.token;
    await request(app).post('/auth/logout').set(authed(tablet)).expect(204);

    const { body } = await listSessions(app, phone).expect(200);

    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0]).toEqual({
      id: expect.any(Number),
      device: 'WOD iOS (iPhone 15)',
      createdAt: expect.any(String),
      lastUsedAt: expect.any(String),
      expiresAt: expect.any(String),
      current: true,
    });
    expect(JSON.stringify(body)).not.toMatch(/token|hash/i);
  });

  it('S-02: DELETE /auth/sessions/:id revoca otra sesión propia y su token da 401', async () => {
    const { app } = makeTestApp();
    const first = await registerAndLogin(app);
    const second = (await login(app).expect(200)).body.token;
    const { body } = await listSessions(app, first).expect(200);
    const other = body.sessions.find((s: { current: boolean }) => !s.current);

    await request(app).delete(`/auth/sessions/${other.id}`).set(authed(first)).expect(204);

    await me(app, second).expect(401);
    await me(app, first).expect(200);
  });

  it('S-02: no se puede revocar la sesión de otro usuario (404 y sin cambios)', async () => {
    const { app } = makeTestApp();
    const ana = await registerAndLogin(app);
    await register(app, { email: 'beto@example.com' }).expect(201);
    const beto = (await login(app, 'beto@example.com').expect(200)).body.token;
    const betoSessionId = (await listSessions(app, beto).expect(200)).body.sessions[0].id;

    const res = await request(app).delete(`/auth/sessions/${betoSessionId}`).set(authed(ana)).expect(404);

    expect(res.body.error.code).toBe('SESSION_NOT_FOUND');
    await me(app, beto).expect(200);
  });

  it('DELETE /auth/sessions/:id con id inválido da 404', async () => {
    const { app } = makeTestApp();
    const token = await registerAndLogin(app);
    await request(app).delete('/auth/sessions/abc').set(authed(token)).expect(404);
  });

  it('S-02: POST /auth/logout-all revoca todas las sesiones; cada token da 401', async () => {
    const { app } = makeTestApp();
    const first = await registerAndLogin(app);
    const second = (await login(app).expect(200)).body.token;

    await request(app).post('/auth/logout-all').set(authed(second)).expect(204);

    await me(app, first).expect(401);
    await me(app, second).expect(401);
  });

  it('el User-Agent se guarda sanitizado y acotado', async () => {
    const { app, db } = makeTestApp();
    await register(app).expect(201);
    await login(app).set('User-Agent', `WOD\u00e9 ${'x'.repeat(300)}`).expect(200);

    const { device } = db.prepare('SELECT device FROM sessions').get() as { device: string };
    expect(device).toMatch(/^WOD x+$/);
    expect(device.length).toBe(120);
  });
});

describe('POST /auth/rotate', () => {
  it('S-02: entrega un token nuevo y el viejo queda revocado (401)', async () => {
    const { app } = makeTestApp();
    const oldToken = await registerAndLogin(app);

    const { body } = await request(app).post('/auth/rotate').set(authed(oldToken)).expect(200);

    expect(body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(body.token).not.toBe(oldToken);
    await me(app, oldToken).expect(401);
    await me(app, body.token).expect(200);
  });

  it('sin token da 401', async () => {
    const { app } = makeTestApp();
    await request(app).post('/auth/rotate').expect(401);
  });
});

describe('PATCH /auth/me', () => {
  it('actualiza nombre y apellido y los devuelve', async () => {
    const { app } = makeTestApp();
    const token = await registerAndLogin(app);

    const { body } = await request(app)
      .patch('/auth/me')
      .set(authed(token))
      .send({ firstName: '  Anita ', lastName: 'Gómez' })
      .expect(200);

    expect(body.user).toMatchObject({ firstName: 'Anita', lastName: 'Gómez', email: 'ana@example.com' });
    expect((await me(app, token).expect(200)).body.user.firstName).toBe('Anita');
  });

  it('S-05: rechaza email, password, campos extra o un body vacío', async () => {
    const { app } = makeTestApp();
    const token = await registerAndLogin(app);
    const patch = (body: object) => request(app).patch('/auth/me').set(authed(token)).send(body);

    await patch({ email: 'otro@example.com' }).expect(400);
    await patch({ firstName: 'Ana', password: 'otra contraseña larga' }).expect(400);
    await patch({}).expect(400);
    await patch({ firstName: '' }).expect(400);
    await patch({ lastName: 'x'.repeat(51) }).expect(400);

    expect((await me(app, token).expect(200)).body.user.email).toBe('ana@example.com');
  });

  it('S-02: con token revocado da 401', async () => {
    const { app } = makeTestApp();
    const token = await registerAndLogin(app);
    await request(app).post('/auth/logout').set(authed(token)).expect(204);
    await request(app).patch('/auth/me').set(authed(token)).send({ firstName: 'X' }).expect(401);
  });
});
