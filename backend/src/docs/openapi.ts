import { OpenAPIRegistry, OpenApiGeneratorV3, type RouteConfig } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '../auth/auth.schemas.js';

// Los bodies son los mismos schemas que valida el backend; las respuestas se
// describen acá porque las rutas arman el JSON a mano.
const publicUser = z.object({
  id: z.number().int(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.email(),
  emailVerified: z.boolean(),
  createdAt: z.iso.datetime(),
});

const apiError = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
  }),
});

const tokenResponse = z.object({ token: z.string().length(43), expiresAt: z.iso.datetime() });
const userResponse = z.object({ user: publicUser });
const messageResponse = z.object({ message: z.string() });
const sessionsResponse = z.object({
  sessions: z.array(
    z.object({
      id: z.number().int(),
      device: z.string().nullable(),
      createdAt: z.iso.datetime(),
      lastUsedAt: z.iso.datetime(),
      expiresAt: z.iso.datetime(),
      current: z.boolean(),
    }),
  ),
});

const json = (schema: z.ZodType) => ({ content: { 'application/json': { schema } } });
const errorResponse = (description: string) => ({ description, ...json(apiError) });
const noContent = { description: 'Sin contenido' };
const unauthorized = errorResponse('Token ausente, inválido, vencido o revocado');
const tooMany = errorResponse('Rate limit superado');

const routes: RouteConfig[] = [
  {
    method: 'post',
    path: '/auth/register',
    summary: 'Crear cuenta de entrenador (no crea sesión)',
    request: { body: json(registerSchema) },
    responses: {
      201: { description: 'Cuenta creada', ...json(userResponse) },
      400: errorResponse('Datos inválidos'),
      409: errorResponse('Email ya registrado'),
      429: tooMany,
    },
  },
  {
    method: 'post',
    path: '/auth/login',
    summary: 'Iniciar sesión',
    request: { body: json(loginSchema) },
    responses: {
      200: { description: 'Sesión creada', ...json(tokenResponse.extend({ user: publicUser })) },
      401: errorResponse('Email o contraseña incorrectos (mensaje genérico)'),
      429: tooMany,
    },
  },
  {
    method: 'get',
    path: '/auth/me',
    summary: 'Perfil y estado de la sesión actual',
    security: [{ bearer: [] }],
    responses: {
      200: {
        description: 'Perfil',
        ...json(
          userResponse.extend({
            session: z.object({ createdAt: z.iso.datetime(), expiresAt: z.iso.datetime() }),
          }),
        ),
      },
      401: unauthorized,
    },
  },
  {
    method: 'patch',
    path: '/auth/me',
    summary: 'Editar nombre y apellido',
    security: [{ bearer: [] }],
    request: { body: json(updateProfileSchema) },
    responses: { 200: { description: 'Perfil actualizado', ...json(userResponse) }, 400: errorResponse('Datos inválidos'), 401: unauthorized },
  },
  {
    method: 'post',
    path: '/auth/logout',
    summary: 'Revocar la sesión actual',
    security: [{ bearer: [] }],
    responses: { 204: noContent, 401: unauthorized },
  },
  {
    method: 'post',
    path: '/auth/logout-all',
    summary: 'Revocar todas las sesiones del usuario',
    security: [{ bearer: [] }],
    responses: { 204: noContent, 401: unauthorized },
  },
  {
    method: 'post',
    path: '/auth/rotate',
    summary: 'Cambiar el token de la sesión actual (el anterior queda revocado)',
    security: [{ bearer: [] }],
    responses: { 200: { description: 'Token nuevo', ...json(tokenResponse) }, 401: unauthorized },
  },
  {
    method: 'get',
    path: '/auth/sessions',
    summary: 'Sesiones activas del usuario',
    security: [{ bearer: [] }],
    responses: { 200: { description: 'Sesiones', ...json(sessionsResponse) }, 401: unauthorized },
  },
  {
    method: 'delete',
    path: '/auth/sessions/{id}',
    summary: 'Revocar una sesión propia',
    security: [{ bearer: [] }],
    request: { params: z.object({ id: z.string() }) },
    responses: { 204: noContent, 401: unauthorized, 404: errorResponse('No existe o no es del usuario') },
  },
  {
    method: 'post',
    path: '/auth/password/forgot',
    summary: 'Pedir un código para restablecer la contraseña (misma respuesta exista o no la cuenta)',
    request: { body: json(forgotPasswordSchema) },
    responses: { 202: { description: 'Aceptado', ...json(messageResponse) }, 429: tooMany },
  },
  {
    method: 'post',
    path: '/auth/password/reset',
    summary: 'Restablecer la contraseña con el código; revoca todas las sesiones',
    request: { body: json(resetPasswordSchema) },
    responses: { 204: noContent, 400: errorResponse('Código inválido o vencido, o datos inválidos'), 429: tooMany },
  },
  {
    method: 'post',
    path: '/auth/email/verification',
    summary: 'Reenviar el código de verificación de email',
    security: [{ bearer: [] }],
    responses: { 202: { description: 'Aceptado', ...json(messageResponse) }, 401: unauthorized, 429: tooMany },
  },
  {
    method: 'post',
    path: '/auth/email/verify',
    summary: 'Verificar el email con el código',
    security: [{ bearer: [] }],
    request: { body: json(verifyEmailSchema) },
    responses: {
      200: { description: 'Email verificado', ...json(userResponse) },
      400: errorResponse('Código inválido o vencido'),
      401: unauthorized,
    },
  },
];

export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry();
  registry.registerComponent('securitySchemes', 'bearer', {
    type: 'http',
    scheme: 'bearer',
    description: 'Token opaco de 43 caracteres que devuelve /auth/login',
  });
  for (const route of routes) registry.registerPath(route);

  return new OpenApiGeneratorV3(registry.definitions).generateDocument({
    openapi: '3.0.3',
    info: { title: 'WOD API', version: '1.0.0', description: 'Solo disponible fuera de producción.' },
  });
}
