import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeTestApp } from './helpers.js';

describe('Documentación de la API', () => {
  it('fuera de producción sirve el OpenAPI con todas las rutas y la UI de Swagger', async () => {
    const { app } = makeTestApp({ NODE_ENV: 'development' });

    const { body } = await request(app).get('/docs.json').expect(200);
    expect(body.openapi).toBe('3.0.3');
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining([
        '/auth/register',
        '/auth/login',
        '/auth/me',
        '/auth/logout',
        '/auth/logout-all',
        '/auth/rotate',
        '/auth/sessions',
        '/auth/sessions/{id}',
        '/auth/password/forgot',
        '/auth/password/reset',
        '/auth/email/verification',
        '/auth/email/verify',
      ]),
    );
    expect(body.paths['/auth/register'].post.requestBody.content['application/json'].schema.properties).toHaveProperty(
      'acceptTerms',
    );

    const ui = await request(app).get('/docs/').expect(200);
    expect(ui.text).toContain('swagger-ui');
  });

  it('en producción /docs y /docs.json no existen', async () => {
    const { app } = makeTestApp({ NODE_ENV: 'production' });

    await request(app).get('/docs.json').expect(404);
    await request(app).get('/docs/').expect(404);
  });
});
