import { describe, expect, it } from 'vitest';
import { countUsers, makeTestApp, register } from './helpers.js';

describe('POST /auth/register', () => {
  it('F-01: registro válido persiste el usuario y no devuelve el hash', async () => {
    const { app, db } = makeTestApp();

    const res = await register(app, { email: '  Ana@Example.com ' }).expect(201);

    expect(res.body.user).toEqual({
      id: expect.any(Number),
      firstName: 'Ana',
      lastName: 'García',
      email: 'ana@example.com',
      createdAt: expect.any(String),
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password|hash|token/i);

    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(res.body.user.id) as Record<string, unknown>;
    expect(row.email).toBe('ana@example.com');
    expect(row.terms_accepted_at).toEqual(expect.any(Number));
  });

  it('F-02: email duplicado (aunque cambien mayúsculas y espacios) da 409 y no duplica', async () => {
    const { app, db } = makeTestApp();
    await register(app).expect(201);

    const res = await register(app, { email: '  ANA@example.COM ' }).expect(409);

    expect(res.body.error.code).toBe('EMAIL_TAKEN');
    expect(countUsers(db)).toBe(1);
  });

  it('F-02: email inválido da 400 y no crea usuario', async () => {
    const { app, db } = makeTestApp();

    const res = await register(app, { email: 'no-es-un-email' }).expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fields).toHaveProperty('email');
    expect(countUsers(db)).toBe(0);
  });

  it.each([
    ['contraseñas distintas', { confirmPassword: 'otra contraseña larga' }, 'confirmPassword'],
    ['contraseña de 11 caracteres', { password: 'a'.repeat(11), confirmPassword: 'a'.repeat(11) }, 'password'],
    ['contraseña de 129 caracteres', { password: 'a'.repeat(129), confirmPassword: 'a'.repeat(129) }, 'password'],
  ])('F-03: %s da 400 y no crea usuario', async (_case, overrides, field) => {
    const { app, db } = makeTestApp();

    const res = await register(app, overrides).expect(400);

    expect(res.body.error.fields).toHaveProperty(field);
    expect(countUsers(db)).toBe(0);
  });

  it('F-03: acepta contraseñas de 12 y de 128 caracteres', async () => {
    const { app } = makeTestApp();
    await register(app, { password: 'a'.repeat(12), confirmPassword: 'a'.repeat(12) }).expect(201);
    await register(app, {
      email: 'otro@example.com',
      password: 'b'.repeat(128),
      confirmPassword: 'b'.repeat(128),
    }).expect(201);
  });

  it.each([
    ['en false', { acceptTerms: false }],
    ['ausentes', { acceptTerms: undefined }],
    ['como string "true"', { acceptTerms: 'true' }],
  ])('F-04: términos %s bloquean el registro', async (_case, overrides) => {
    const { app, db } = makeTestApp();

    const res = await register(app, overrides).expect(400);

    expect(res.body.error.fields).toHaveProperty('acceptTerms');
    expect(countUsers(db)).toBe(0);
  });

  it('F-11: dos registros simultáneos con el mismo email crean un solo usuario', async () => {
    const { app, db } = makeTestApp();

    const results = await Promise.all([register(app), register(app)]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(countUsers(db)).toBe(1);
  });
});
