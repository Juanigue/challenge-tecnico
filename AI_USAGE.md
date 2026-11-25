# Uso de IA

## Herramientas
- **Cursor** (asistente en el editor), modelo Claude Opus 5.5 con esfuerzo medio: plan, código y tests del proyecto. Reglas persistentes en `.cursor/rules/` (`project.mdc` y `plan.mdc`).
- **Claude (chat)**: planificación, elección de stack, diseño de las reglas para Cursor y revisión crítica de los planes que devolvió Cursor.

## Registro por fase
| Fase | Herramienta | Qué generó la IA | Qué revisé yo | Cómo lo comprobé |
|---|---|---|---|---|
| 0. Setup | Claude (chat) | Estructura del repo, `.gitignore`, reglas de Cursor, plantilla de este registro | Que `.env` y las bases `.db` quedaran fuera de Git; que `mobile/` y `backend/` quedaran como carpetas hermanas | `git check-ignore -v backend/.env`; `git ls-files` filtrando `.env`, `.db`, `node_modules` y `.claude` (sin resultados); revisión del repo en GitHub |
| 1. Backend (plan) | Cursor (Opus 5.5 Medium) | Plan de diseño en 6 tablas: esquema SQL, endpoints, amenazas, estructura de carpetas, tests y dependencias | Esquema (hash del token, `revoked_at`, `expires_at`, `UNIQUE`), respuestas de login, rate limit, mapeo de tests a los IDs del enunciado | Revisé cada tabla contra los eliminatorios del enunciado y contra una segunda revisión en Claude (chat) antes de aprobar |
| 1. Backend (código) | Cursor (Opus 5.5) | Migración `001_init.sql`, `src/` (config, db, auth, middlewares, app, server) y 8 archivos de tests (47 tests). Verificación de la IA: `tsc --noEmit` sin errores, `npm test` 47/47 en verde, mutación (quitar `revoked_at IS NULL`) que pone en rojo F-09 y S-02, y prueba con curl de los 4 endpoints contra `npm run dev` | ⏳ Pendiente: leer `password.ts`, `sessions.ts` y `requireAuth.ts` línea por línea | ⏳ Pendiente: correr `npm test` yo mismo, revisión de la BD con DB Browser for SQLite (hash `$argon2id$`, sin token en claro) |
| 2. Auth mobile | | ⏳ Pendiente | | |
| 3. UI | | ⏳ Pendiente | | |

## Decisiones que tomé sobre el plan de la IA
| Tema | Opciones que propuso la IA | Mi decisión |
|---|---|---|
| Email ya registrado | Respuesta genérica o 409 explícito | 409 `EMAIL_TAKEN` con rate limit por IP, porque el enunciado pide error claro; el trade-off de revelar cuentas va al threat model |
| Sesión tras registrarse | Login automático o no | No: el registro devuelve 201 sin token y mobile llama a `/auth/login` |
| Lenguaje del backend | JavaScript o TypeScript | TypeScript con `tsx` |

## Qué corregí de lo que propuso la IA
| Fase | Qué propuso | Problema que encontré | Qué hice |
|---|---|---|---|
| 1 | Límite de registro fijo de 5 por hora por IP | Me bloquearía a mí y al evaluador al probar a mano F-01 a F-04 y F-11, aunque sea configurable en tests | Pedí valor por defecto más alto en desarrollo, 5 por hora solo como valor de producción documentado, y aclarar que el store es en memoria y se resetea al reiniciar |
| 1 | Rate limit de login por email | Si no cuenta los emails inexistentes, el 429 revelaría qué cuentas existen | Pedí que la clave sea el email normalizado y que cuente también los inexistentes |
| 1 | Tests de backend con BD en memoria | No prueban que los datos persisten tras reiniciar el servidor, y la carpeta `data/` no existe en un clon limpio | Pedí un test de persistencia con archivo SQLite temporal y que `connection.ts` cree la carpeta |
| 1 | `GET /auth/me` con id, nombre, email y fecha de alta | El enunciado pide mostrar el "estado de sesión" en el Home | Pedí agregar `session.expiresAt` a la respuesta |
| 1 | Argon2 con parámetros no explícitos en la tabla | Depender de valores por defecto de la librería | Pedí algoritmo Argon2id y costos explícitos, iguales para el hash dummy |
| 1 | Dependencias y scripts que usan `--env-file` | Mi Node es v24 y el evaluador podría tener otra versión | Pedí `engines` en `package.json` y un `.nvmrc` |
| 1 | Sesiones vencidas sin limpieza | Se acumulan sin límite | Pedí borrarlas al arrancar el servidor |

> Estado: los 7 ajustes quedaron en el plan y están implementados; cada uno tiene su test (ver `backend/tests/`).

## Qué no delegué
- Decisiones de seguridad (hashing, sesiones, revocación).
- Aprobar el plan en tablas antes de que se genere cualquier código.
- Revisión final de cada archivo antes de commitear.
- Ejecutar los tests y revisar la base de datos a mano, sin depender del resumen de la IA.

## Limitaciones conocidas del uso de IA
- Fase 1, no verificado: que el tiempo del login sea parecido con email existente e inexistente (solo se garantiza que ambos caminos ejecutan Argon2id con el mismo costo, no se midió); comportamiento del rate limit detrás de un proxy (`trust proxy` no está configurado); instalación en otro sistema operativo o versión de Node distinta de Windows + Node 24.22.
- Fase 1, instalación: npm 11 bloqueó los scripts de instalación de `better-sqlite3` (`node-gyp rebuild`) y `esbuild` porque no están en `allowScripts`. No hizo falta ninguno: `better-sqlite3` 13.2.0 trae el binario precompilado `prebuilds/win32-x64.node` y tsx/vitest funcionan.
- ⏳ Completar al terminar cada fase: qué no pude verificar y qué sigue pendiente.