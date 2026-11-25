import request from 'supertest';
import { createApp } from '../src/app.js';
import { loadConfig, type Config } from '../src/config.js';
import { openDatabase, type Db } from '../src/db/connection.js';
import { runMigrations } from '../src/db/migrate.js';

export const PASSWORD = 'correct horse battery';

export function testConfig(env: Record<string, string> = {}): Config {
  return loadConfig({
    NODE_ENV: 'test',
    DATABASE_PATH: ':memory:',
    RATE_LIMIT_GLOBAL_PER_15MIN: '1000',
    RATE_LIMIT_REGISTER_PER_HOUR: '1000',
    RATE_LIMIT_LOGIN_IP_PER_15MIN: '1000',
    RATE_LIMIT_LOGIN_EMAIL_PER_15MIN: '1000',
    ...env,
  });
}

export function makeTestApp(env: Record<string, string> = {}, db?: Db) {
  const config = testConfig(env);
  const database = db ?? openDatabase(config.DATABASE_PATH);
  runMigrations(database);
  const logs: string[] = [];
  const app = createApp(database, config, (line) => logs.push(line));
  return { app, db: database, logs };
}

type App = ReturnType<typeof makeTestApp>['app'];

export function validUser(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Ana',
    lastName: 'García',
    email: 'ana@example.com',
    password: PASSWORD,
    confirmPassword: PASSWORD,
    acceptTerms: true,
    ...overrides,
  };
}

export function register(app: App, overrides: Record<string, unknown> = {}) {
  return request(app).post('/auth/register').send(validUser(overrides));
}

export function login(app: App, email = 'ana@example.com', password = PASSWORD) {
  return request(app).post('/auth/login').send({ email, password });
}

export async function registerAndLogin(app: App) {
  await register(app).expect(201);
  const res = await login(app).expect(200);
  return res.body.token as string;
}

export function me(app: App, token?: string) {
  const req = request(app).get('/auth/me');
  return token ? req.set('Authorization', `Bearer ${token}`) : req;
}

export function countUsers(db: Db): number {
  return (db.prepare('SELECT COUNT(*) AS n FROM users').get() as { n: number }).n;
}
