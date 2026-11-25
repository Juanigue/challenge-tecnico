import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { codeFrom, login, makeTestApp, me, PASSWORD, register, registerAndLogin } from './helpers.js';

type App = ReturnType<typeof makeTestApp>['app'];

const NEW_PASSWORD = 'una frase nueva bastante larga';

const forgot = (app: App, email = 'ana@example.com') =>
  request(app).post('/auth/password/forgot').send({ email });

const reset = (app: App, code: string, overrides: Record<string, unknown> = {}) =>
  request(app)
    .post('/auth/password/reset')
    .send({ email: 'ana@example.com', code, password: NEW_PASSWORD, confirmPassword: NEW_PASSWORD, ...overrides });

const wrongCode = (code: string) => String((Number(code) + 1) % 1_000_000).padStart(6, '0');

describe('Recuperación de contraseña', () => {
  it('S-03: forgot responde igual con email existente e inexistente y solo envía mail si hay cuenta', async () => {
    const { app, mails } = makeTestApp();
    await register(app).expect(201);
    mails.length = 0;

    const existing = await forgot(app, 'ANA@example.com ').expect(202);
    const missing = await forgot(app, 'nadie@example.com').expect(202);

    expect(existing.body).toEqual(missing.body);
    expect(mails).toHaveLength(1);
    expect(mails[0]!.to).toBe('ana@example.com');
    expect(codeFrom(mails[0])).toMatch(/^\d{6}$/);
  });

  it('S-01: el código se guarda solo como hash', async () => {
    const { app, db, mails } = makeTestApp();
    await register(app).expect(201);
    await forgot(app).expect(202);
    const code = codeFrom(mails.at(-1));

    const rows = db.prepare('SELECT code_hash FROM one_time_codes').all() as { code_hash: string }[];
    expect(rows.every((row) => /^[a-f0-9]{64}$/.test(row.code_hash))).toBe(true);
    expect(JSON.stringify(rows)).not.toContain(code);
  });

  it('S-02: reset válido cambia la contraseña y revoca todas las sesiones', async () => {
    const { app, mails } = makeTestApp();
    const oldToken = await registerAndLogin(app);
    await forgot(app).expect(202);

    await reset(app, codeFrom(mails.at(-1))).expect(204);

    await me(app, oldToken).expect(401);
    await login(app, 'ana@example.com', PASSWORD).expect(401);
    await login(app, 'ana@example.com', NEW_PASSWORD).expect(200);
  });

  it('el código sirve una sola vez', async () => {
    const { app, mails } = makeTestApp();
    await register(app).expect(201);
    await forgot(app).expect(202);
    const code = codeFrom(mails.at(-1));

    await reset(app, code).expect(204);
    const res = await reset(app, code, { password: 'otra frase muy larga', confirmPassword: 'otra frase muy larga' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_CODE');
  });

  it('pedir un código nuevo invalida el anterior', async () => {
    const { app, mails } = makeTestApp();
    await register(app).expect(201);
    await forgot(app).expect(202);
    const first = codeFrom(mails.at(-1));
    await forgot(app).expect(202);
    const second = codeFrom(mails.at(-1));

    if (first !== second) await reset(app, first).expect(400);
    await reset(app, second).expect(204);
  });

  it('al llegar a 5 intentos fallidos el código se bloquea aunque después se envíe el correcto', async () => {
    const { app, mails } = makeTestApp();
    await register(app).expect(201);
    await forgot(app).expect(202);
    const code = codeFrom(mails.at(-1));

    for (let i = 0; i < 5; i++) await reset(app, wrongCode(code)).expect(400);

    await reset(app, code).expect(400);
    await login(app).expect(200);
  });

  it('un código vencido se rechaza', async () => {
    const { app, db, mails } = makeTestApp();
    await register(app).expect(201);
    await forgot(app).expect(202);
    db.prepare('UPDATE one_time_codes SET expires_at = ?').run(Date.now() - 1);

    await reset(app, codeFrom(mails.at(-1))).expect(400);
  });

  it('S-05: reset sin cuenta, con código mal formado o contraseñas distintas se rechaza', async () => {
    const { app } = makeTestApp();
    await register(app).expect(201);

    const noAccount = await reset(app, '123456', { email: 'nadie@example.com' }).expect(400);
    expect(noAccount.body.error.code).toBe('INVALID_CODE');
    await reset(app, '12ab56').expect(400);
    await reset(app, '123456', { password: 'corta', confirmPassword: 'corta' }).expect(400);
    await reset(app, '123456', { confirmPassword: 'no coincide para nada' }).expect(400);
  });

  it('S-03: forgot tiene rate limit por email normalizado', async () => {
    const { app } = makeTestApp({ RATE_LIMIT_PASSWORD_EMAIL_PER_15MIN: '2' });

    await forgot(app, 'nadie@example.com').expect(202);
    await forgot(app, ' NADIE@example.com').expect(202);
    const res = await forgot(app, 'nadie@example.com').expect(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
  });

  it('S-04: los logs no incluyen el código ni el email', async () => {
    const { app, logs, mails } = makeTestApp();
    await register(app).expect(201);
    await forgot(app).expect(202);
    const code = codeFrom(mails.at(-1));
    await reset(app, code).expect(204);

    expect(logs.join('\n')).not.toContain(code);
    expect(logs.join('\n')).not.toContain('ana@example.com');
  });
});

describe('Verificación de email', () => {
  const authed = (token: string) => ({ Authorization: `Bearer ${token}` });

  it('el registro envía el código y verificarlo marca emailVerified', async () => {
    const { app, mails } = makeTestApp();
    const token = await registerAndLogin(app);
    expect(mails).toHaveLength(1);
    expect((await me(app, token)).body.user.emailVerified).toBe(false);

    const { body } = await request(app)
      .post('/auth/email/verify')
      .set(authed(token))
      .send({ code: codeFrom(mails[0]) })
      .expect(200);

    expect(body.user.emailVerified).toBe(true);
    expect((await me(app, token)).body.user.emailVerified).toBe(true);
  });

  it('reenviar genera un código nuevo y el anterior deja de servir', async () => {
    const { app, mails } = makeTestApp();
    const token = await registerAndLogin(app);
    const first = codeFrom(mails[0]);

    await request(app).post('/auth/email/verification').set(authed(token)).expect(202);
    const second = codeFrom(mails.at(-1));

    if (first !== second) {
      await request(app).post('/auth/email/verify').set(authed(token)).send({ code: first }).expect(400);
    }
    await request(app).post('/auth/email/verify').set(authed(token)).send({ code: second }).expect(200);
  });

  it('con el email ya verificado no se envían más códigos', async () => {
    const { app, mails } = makeTestApp();
    const token = await registerAndLogin(app);
    await request(app).post('/auth/email/verify').set(authed(token)).send({ code: codeFrom(mails[0]) }).expect(200);

    await request(app).post('/auth/email/verification').set(authed(token)).expect(202);
    expect(mails).toHaveLength(1);
  });

  it('S-02: verificar o reenviar sin sesión válida da 401', async () => {
    const { app } = makeTestApp();
    const token = await registerAndLogin(app);
    await request(app).post('/auth/logout').set(authed(token)).expect(204);

    await request(app).post('/auth/email/verification').set(authed(token)).expect(401);
    await request(app).post('/auth/email/verify').set(authed(token)).send({ code: '123456' }).expect(401);
  });

  it('un código incorrecto da 400 y no verifica', async () => {
    const { app, mails } = makeTestApp();
    const token = await registerAndLogin(app);

    await request(app)
      .post('/auth/email/verify')
      .set(authed(token))
      .send({ code: wrongCode(codeFrom(mails[0])) })
      .expect(400);
    expect((await me(app, token)).body.user.emailVerified).toBe(false);
  });

  it('si el envío del mail falla, el registro igual responde 201 y se loguea sin datos', async () => {
    const { createApp } = await import('../src/app.js');
    const { testConfig } = await import('./helpers.js');
    const { openDatabase } = await import('../src/db/connection.js');
    const { runMigrations } = await import('../src/db/migrate.js');
    const db = openDatabase(':memory:');
    runMigrations(db);
    const logs: string[] = [];
    const app = createApp(db, testConfig(), (line) => logs.push(line), {
      send: async () => {
        throw new Error('connect ECONNREFUSED');
      },
    });

    await request(app).post('/auth/register').send({
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@example.com',
      password: PASSWORD,
      confirmPassword: PASSWORD,
      acceptTerms: true,
    }).expect(201);
    await new Promise((resolve) => setImmediate(resolve));

    expect(logs).toContain('[mail] envío fallido: connect ECONNREFUSED');
    expect(logs.join('\n')).not.toContain('ana@example.com');
  });
});
