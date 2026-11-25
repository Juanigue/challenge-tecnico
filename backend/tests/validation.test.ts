import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { countUsers, makeTestApp, validUser } from './helpers.js';

function expectNoInternals(body: unknown) {
  expect(JSON.stringify(body)).not.toMatch(/stack|at \w+ \(|node_modules|sqlite/i);
}

describe('Validación de payloads', () => {
  it('S-05: rechaza campos extra (mass assignment)', async () => {
    const { app, db } = makeTestApp();

    const res = await request(app)
      .post('/auth/register')
      .send({ ...validUser(), id: 1, password_hash: 'x' })
      .expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(countUsers(db)).toBe(0);
    expectNoInternals(res.body);
  });

  it.each([
    ['email como número', { email: 123 }],
    ['password como array', { password: ['a'.repeat(12)], confirmPassword: ['a'.repeat(12)] }],
    ['nombre vacío tras trim', { firstName: '   ' }],
    ['nombre de 51 caracteres', { firstName: 'a'.repeat(51) }],
  ])('S-05: rechaza tipos o valores inválidos (%s)', async (_case, overrides) => {
    const { app, db } = makeTestApp();

    const res = await request(app).post('/auth/register').send(validUser(overrides)).expect(400);

    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(countUsers(db)).toBe(0);
  });

  it('S-05: rechaza campos extra en el login', async () => {
    const { app } = makeTestApp();
    await request(app)
      .post('/auth/login')
      .send({ email: 'ana@example.com', password: 'x', admin: true })
      .expect(400);
  });

  it('S-05: JSON mal formado da 400 sin stack', async () => {
    const { app } = makeTestApp();

    const res = await request(app)
      .post('/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "ana@example.com",')
      .expect(400);

    expect(res.body.error.code).toBe('INVALID_BODY');
    expectNoInternals(res.body);
  });

  it('S-05: body mayor a 10 kb da 413', async () => {
    const { app } = makeTestApp();

    const res = await request(app)
      .post('/auth/register')
      .send(validUser({ firstName: 'a'.repeat(11 * 1024) }))
      .expect(413);

    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('S-05: body que no es JSON da 400', async () => {
    const { app } = makeTestApp();

    await request(app)
      .post('/auth/login')
      .set('Content-Type', 'text/plain')
      .send('email=ana@example.com&password=x')
      .expect(400);
  });

  it('S-05: ruta desconocida da 404 con el formato de error estándar', async () => {
    const { app } = makeTestApp();
    const res = await request(app).get('/admin').expect(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada' } });
  });
});
