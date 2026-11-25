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
| 2. Auth mobile (plan) | Cursor (Opus 5.5) | Tabla Archivo / Cambio / Por qué / Riesgo, tabla de tests y 3 preguntas (logout sin red, URL del backend, alcance de pantallas) | ⏳ Pendiente | ⏳ Pendiente |
| 2. Auth mobile (código) | Cursor (Opus 5.5) | `src/lib` (URL del backend, SecureStore, cliente HTTP con timeout e interceptor 401), `src/auth` (schemas, API, `AuthProvider`), rutas `(auth)` y `(app)` con `Stack.Protected`, pantallas de login, registro, Home y sin conexión, y 7 archivos de tests (40 tests). Verificación de la IA: `tsc --noEmit` sin errores, `npm test` 40/40 tres veces seguidas sin warnings, y mutaciones (sacar el `useRef` de `useSingleSubmit` y el `&& token` del interceptor) que ponen en rojo F-11 y F-06 | ⏳ Pendiente: leer `auth-context.tsx`, `api-client.ts` y `use-single-submit.ts` línea por línea | Checklist manual de `QA_CHECKLIST.md` en iPhone con Expo Go: todos los casos OK (25/11). Encontré que sin el backend corriendo el registro daba timeout; era que faltaba levantarlo en una segunda terminal |
| 3. UI (plan) | Cursor (Opus 5.5) | Tabla Archivo / Cambio / Por qué / Riesgo a partir de mis pantallas de Figma, el prototipo React y los requisitos 4.1 a 4.5 del enunciado | ⏳ Pendiente | ⏳ Pendiente |
| 3. UI (código) | Cursor (Opus 5.5) | `src/theme/tokens.ts`, kit en `src/components/ui/` (logo y emblema en PNG, íconos en SVG, fondo, tarjeta glass con fallback, botón, campo con ojo, checkbox, banner), `AuthShell`, pantallas de bienvenida, registro, login, términos (modal demo), carga, sin conexión y Home; mock de Reanimated para Jest y 3 archivos de tests nuevos (54 tests en total). Verificación de la IA: `tsc --noEmit` sin errores, `npm test` 54/54 sin warnings, y mutaciones (ignorar "Reducir transparencia" y dejar el ojo sin efecto) que ponen en rojo sus tests | ⏳ Pendiente: leer `glass-card.tsx`, `text-field.tsx` y `auth-shell.tsx` | ⏳ Pendiente: checklist de la Fase 3 en `QA_CHECKLIST.md` en el iPhone |
| 4. Extras (plan) | Cursor (Opus 5.5) | Plan de bonus a partir de la lista "9. Bonus opcionales" del enunciado, con preguntas de alcance (qué extras, tema, proveedor de mail, E2E) | ⏳ Pendiente | ⏳ Pendiente |
| 4. Extras (código) | Cursor (Opus 5.5) | Backend: migración `002_extras.sql`, sesiones múltiples (listar, revocar una, cerrar todas, rotar, último uso y dispositivo), `PATCH /auth/me`, códigos de un solo uso, recuperación de contraseña y verificación de email con nodemailer + Mailpit, Swagger fuera de producción. Mobile: pantallas de recuperación, verificación, perfil y sesiones, rotación al reabrir la app, tema claro/oscuro según el sistema. Infra: `Dockerfile`, `docker-compose.yml`, workflow de CI. Docs: `THREAT_MODEL.md`. Verificación de la IA: typecheck sin errores en los dos proyectos, backend 76/76, mobile 75/75, y mutaciones (sacar el filtro por `user_id` al revocar, el límite de intentos de los códigos y la condición de rotación) que ponen en rojo sus tests | ⏳ Pendiente: leer `codes.ts`, `account.routes.ts`, `sessions.ts` y `auth-context.tsx` | ⏳ Pendiente: checklist de la Fase 4 en `QA_CHECKLIST.md` |

## Decisiones que tomé sobre el plan de la IA

| Tema | Opciones que propuso la IA | Mi decisión |
|---|---|---|
| Email ya registrado | Respuesta genérica o 409 explícito | 409 `EMAIL_TAKEN` con rate limit por IP, porque el enunciado pide error claro; el trade-off de revelar cuentas va al threat model |
| Sesión tras registrarse | Login automático o no | No: el registro devuelve 201 sin token y mobile llama a `/auth/login` |
| Lenguaje del backend | JavaScript o TypeScript | TypeScript con `tsx` |
| Logout sin red | Mantener la sesión y mostrar error, o borrar el token igual | Mantener la sesión: el token se borra solo si el backend confirma (204) o ya la considera inválida (401) |
| URL del backend en mobile | Solo variable de entorno, o variable con fallback a la IP de Metro | `EXPO_PUBLIC_API_URL` con fallback a la IP de Metro y puerto 3000 |
| Qué pasa después de registrarse | La IA había implementado un login automático (interpretación suya: las reglas no lo definen) | Ir siempre al login con "Cuenta creada" y el email precargado. Evita el caso en que el registro sale bien, el login automático falla y un reintento da "email ya registrado" |
| Alcance de pantallas en la Fase 2 | Mínimas o funcionales | Funcionales con estilo mínimo; el diseño visual queda para la Fase 3 |
| Fase 3: dependencias de UI | Librería de íconos y `expo-linear-gradient`, o una sola librería de SVG | Solo `react-native-svg` (íconos y gradiente; el logo y el emblema son mis PNG con `expo-image`, que ya venía en el template) más `expo-blur`, que ya estaba en el stack |
| Fase 3: blur en Android | Blur experimental de `expo-blur` o superficie sólida | Superficie sólida semitransparente en Android y cuando iOS tiene activado "Reducir transparencia" |
| Fase 3: login | Copiar "Recordarme" y "¿Olvidaste tu contraseña?" del Figma | Sacarlos: no tienen backend y quedarían como estados rotos (en la Fase 4 "¿Olvidaste tu contraseña?" volvió, ya con backend) |
| Fase 4: alcance | Distintos subconjuntos de la lista de bonus | Todos menos el test E2E mobile |
| Fase 4: mails | Loguear el código en consola o mandar mails reales a una bandeja local | Mailpit con nodemailer; en los tests, un mailer falso en memoria |
| Fase 4: formato de recuperación | Link en el mail o código de 6 dígitos | Código: el mail se abre en Mailpit en la PC, no en el teléfono, así que un link no serviría |
| Fase 4: tema | Solo oscuro, o claro y oscuro según el sistema | Claro y oscuro según el sistema, sin selector manual |

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
- Fase 2, bug que encontraron los tests: con `Stack.Protected` solo, abrir la app sin sesión en `/` mostraba "Unmatched Route" (no redirige cuando la URL inicial ya es protegida). Se agregó `src/app/index.tsx` como entrada pública que redirige a `/home` o `/login`, y Home pasó a `(app)/home.tsx`.
- Fase 2, no verificado por la IA: todo lo que depende del dispositivo real (keychain de iOS, splash nativo, gesto de volver, HTTP desde Expo Go por la LAN, firewall de Windows). Los tests usan un mock en memoria de SecureStore y un `fetch` simulado; eso se cubre con el checklist manual.
- Fase 2, instalación: `npx expo install` eligió `expo-secure-store` 58.0.3 y agregó su plugin a `app.json`. RNTL 14.1.0 pide `test-renderer` (no `react-test-renderer`). npm reporta 22 vulnerabilidades moderadas en dependencias de desarrollo; no se corrió `npm audit fix --force` porque cambiaría versiones del SDK.
- Fase 3, instalación: `npx expo install` eligió `react-native-svg` 15.16.0 y `expo-blur` 58.0.6 (fijadas en versión exacta).
- Fase 3, tests: Reanimated 4.7.1 no carga bajo Jest (su inicializador nativo llama a `setCSSEventHandler`, que la implementación JS no tiene) y su mock oficial importa ese mismo código; `expo-router/testing-library` se traga el error y deja el módulo vacío. Se reemplazó por un mock propio chico (`tests/mocks/`) vía `moduleNameMapper`. Consecuencia: los tests no ejecutan las animaciones, solo verifican que las pantallas funcionan con ellas.
- Fase 3, no verificado por la IA: nada visual. No vio cómo se ven el blur, el contraste, las safe areas ni el teclado en un dispositivo real; tampoco "Reducir transparencia" ni "Reducir movimiento" reales. Android no se probó en ningún dispositivo ni emulador. El fallback de glass se verificó solo con tests que simulan la plataforma.
- Fase 3, pendiente: la imagen del splash nativo sigue siendo la de Expo (solo cambió el fondo a `#051F20`); la pantalla "Preparando tu espacio" solo aparece al reintentar desde "sin conexión", porque al abrir la app el splash nativo queda visible hasta que `/auth/me` responde (regla del proyecto). Los textos del diseño usan tuteo ("Crea tu perfil") y los mensajes de la Fase 2 voseo ("Ingresá con tu contraseña").
- Fase 4, instalación: nodemailer 10.6.1, `@asteasolutions/zod-to-openapi` 9.1.0 y swagger-ui-express 5.0.1 en el backend (más sus `@types`). En mobile no se agregó ninguna dependencia (`expo-device` ya venía en el template). Un `npx expo lint` de la IA instaló ESLint sin pedir permiso; se revirtió (`package.json` y lockfile restaurados con `git checkout`, `npm ci`) y no queda en el proyecto.
- Fase 4, CI: las typed routes de Expo (`.expo/types/router.d.ts`) solo las genera `expo start`; no hay un comando aparte. El workflow levanta `expo start` hasta que aparece el archivo (localmente tardó 5 s) y falla con el log si no aparece en 2 minutos. Sin ese archivo el typecheck pasa igual, pero las rutas quedan tipadas como `string`.
- Fase 4, tests en frío: sin caché de Jest (como en CI), la corrida en paralelo tardó 77 s y 8 tests superaron el timeout de 5 s mientras se compilaba; en serie (`--runInBand`) pasaron los 86 en 26 s. El workflow usa `--runInBand`.
- Fase 4, botón de tema: usa `Appearance.setColorScheme` de React Native 0.88 (confirmado en sus tipos), que fuerza el modo en toda la app; la elección se guarda en SecureStore (`wod.theme`) y se aplica antes de ocultar el splash. En Jest no hay módulo nativo, así que los tests simulan el cambio con un spy.
- Fase 4, tema: en Jest, `useColorScheme` devuelve `light`, así que el resto de los tests corre en modo claro; el test del tema mockea el hook para probar los dos modos. El splash nativo quedó oscuro en los dos modos porque el ícono es el blanco de Expo y no se vería sobre fondo claro.
- Fase 4, no verificado por la IA: la entrega real de mails en Mailpit (Docker no está instalado en la PC; los tests usan un mailer falso); `docker compose up` (se comprobó solo que el servidor arranca con las mismas variables de entorno, sin `.env`); la ejecución del workflow en GitHub Actions; cómo se ve el modo claro en el iPhone (contrastes calculados, no medidos en pantalla); la rotación con el reloj real (los tests simulan la edad de la sesión); el `User-Agent` real que manda Expo Go desde el iPhone.
- ⏳ Completar al terminar cada fase: qué no pude verificar y qué sigue pendiente.