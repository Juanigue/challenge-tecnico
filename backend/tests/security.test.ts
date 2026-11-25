import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { login, makeTestApp, me, PASSWORD, register } from './helpers.js';

describe('Seguridad', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('S-01: la contraseña se guarda como hash Argon2id con los parámetros fijados', async () => {
    const { app, db } = makeTestApp();
    await register(app).expect(201);

    const { password_hash } = db.prepare('SELECT password_hash FROM users').get() as {
      password_hash: string;
    };

    expect(password_hash.startsWith('$argon2id$v=19$m=19456,t=2,p=1$')).toBe(true);
    expect(password_hash).not.toBe(PASSWORD);
    expect(password_hash).not.toContain(PASSWORD);
  });

  it('S-04: ni los logs ni la tabla sessions contienen la contraseña o el token', async () => {
    const consoleLines: string[] = [];
    const capture = (...args: unknown[]) => consoleLines.push(args.map(String).join(' '));
    for (const method of ['log', 'info', 'warn', 'error', 'debug'] as const) {
      vi.spyOn(console, method).mockImplementation(capture);
    }

    const { app, db, logs } = makeTestApp();
    await register(app).expect(201);
    await login(app, 'ana@example.com', 'contraseña incorrecta').expect(401);
    const { body } = await login(app).expect(200);
    await me(app, body.token).expect(200);
    await request(app).post('/auth/logout').set('Authorization', `Bearer ${body.token}`).expect(204);

    const allLogs = [...logs, ...consoleLines].join('\n');
    expect(logs.length).toBeGreaterThan(0);
    expect(allLogs).not.toContain(PASSWORD);
    expect(allLogs).not.toContain('contraseña incorrecta');
    expect(allLogs).not.toContain(body.token);
    expect(allLogs).not.toContain('$argon2id$');

    const sessionsDump = JSON.stringify(db.prepare('SELECT * FROM sessions').all());
    expect(sessionsDump).not.toContain(body.token);
  });

  it('S-04: el log de requests registra solo método, ruta, status y duración', async () => {
    const { app, logs } = makeTestApp();
    await request(app).get('/auth/me?token=secreto').set('Authorization', 'Bearer x').expect(401);

    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatch(/^GET \/auth\/me 401 \d+ms$/);
  });

  it('S-04: la respuesta no expone tecnología del servidor', async () => {
    const { app } = makeTestApp();
    const res = await me(app).expect(401);
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
