# Modelo de amenazas

Alcance: el módulo de acceso de WOD (registro, login, sesiones, recuperación de contraseña, verificación de email y perfil). Backend Express + SQLite y app Expo. El entorno es de desarrollo local (HTTP en la LAN); lo que cambia en producción está marcado.

## Activos

| Activo | Dónde vive | Qué pasa si se filtra |
|---|---|---|
| Contraseñas | Solo como hash Argon2id (m=19456, t=2, p=1) en `users.password_hash` | Con el hash, el atacante necesita fuerza bruta offline cara; en texto plano tendría acceso directo y reutilización en otros sitios |
| Token de sesión | En el teléfono, en `expo-secure-store` (Keychain / Keystore). En la BD solo su SHA-256 | Quien tenga el token actúa como el usuario hasta que venza o se revoque |
| Códigos de un solo uso (reset y verificación) | Mail del usuario. En la BD solo su SHA-256 | Un código de reset válido permite cambiar la contraseña |
| Datos personales | Nombre, apellido, email y dispositivo (User-Agent recortado) por sesión | Exposición de datos de la persona |

## Amenazas y mitigaciones

| Amenaza | Mitigación | Dónde se prueba |
|---|---|---|
| Robo de la BD | Contraseñas en Argon2id; tokens y códigos guardados solo como SHA-256, así que la BD sola no sirve para entrar | S-01 (`backend/tests/security.test.ts`, `account.test.ts`) |
| Fuerza bruta de login | Rate limit por IP (10/15 min) y por email normalizado (5 fallidos/15 min, cuenta también emails inexistentes) | S-03 (`backend/tests/rate-limit.test.ts`) |
| Enumeración de cuentas por login | Mismo mensaje para email inexistente y contraseña incorrecta; con email inexistente se calcula un hash dummy con el mismo costo | F-06 |
| Enumeración por recuperación de contraseña | `POST /auth/password/forgot` responde siempre 202 con el mismo mensaje; el mail se manda en segundo plano para que el tiempo de respuesta no dependa de si la cuenta existe | S-03 (`backend/tests/account.test.ts`) |
| Fuerza bruta de códigos de 6 dígitos | Cada código acepta 5 intentos y vence en 15 min; pedir uno nuevo invalida los anteriores; se pueden pedir 3 códigos por email cada 15 min y canjear 10 por IP. Como máximo hay 15 intentos por cuenta cada 15 min sobre un millón de combinaciones | `account.test.ts` |
| Comparación de códigos por tiempo | Se comparan hashes con `timingSafeEqual` | Revisión de código (`src/auth/codes.ts`) |
| Token robado del teléfono | Vence a los 7 días; se rota al reabrir la app pasada la mitad de su vida; el usuario puede ver sus sesiones y cerrar una o todas; cambiar la contraseña por reset revoca todas | S-02 (`sessions.test.ts`, `account.test.ts`) |
| Sesión revocada que sigue sirviendo | Cada request valida `revoked_at IS NULL` y `expires_at` contra la BD; el logout revoca en la BD antes de borrar el token local | S-02 (`me.test.ts`, `logout.test.ts`, `auth-context.test.tsx`) |
| Revocar sesiones de otro usuario | `DELETE /auth/sessions/:id` filtra por el `user_id` de la sesión actual; un id ajeno da 404 igual que uno inexistente | S-02 (`sessions.test.ts`) |
| Payloads maliciosos o inesperados | Zod en cada endpoint con objetos estrictos (rechaza campos extra); body JSON de hasta 10 kB; errores sin stack trace | S-05 (`validation.test.ts`) |
| Fugas por logs | El logger registra solo método, ruta, status y duración. Nunca bodies, tokens, hashes ni códigos. Un mail fallido se registra sin el destinatario | S-04 (`security.test.ts`, `account.test.ts`) |
| Secretos en el repo | `.env` y bases `.db` en `.gitignore`; solo se versiona `.env.example` | S-04 (`git check-ignore`) |
| Headers del navegador y CORS | Helmet; CORS limitado a los orígenes de `CORS_ORIGINS` (la app nativa no manda `Origin`) | Revisión de código (`src/app.ts`) |
| Documentación de la API expuesta | Swagger (`/docs`, `/docs.json`) solo se monta si `NODE_ENV !== 'production'` | `backend/tests/docs.test.ts` |
| User-Agent malicioso guardado como dispositivo | Se guarda solo ASCII imprimible y hasta 120 caracteres | `sessions.test.ts` |
| Scripts maliciosos en `install` / `postinstall` de dependencias | `backend/.npmrc` con `ignore-scripts=true`: npm no ejecuta scripts de instalación y `better-sqlite3` usa el binario de `prebuilds/`. Limitación: solo mitiga scripts de instalación; el código de las dependencias sigue ejecutándose en runtime y en tests. Tampoco hay rebuild automático si falta el prebuild (hay que instalar Build Tools y reconstruir a mano; ver README) | Revisión de config; instalación sin toolchain de C++ |

## Riesgos aceptados

| Riesgo | Por qué se acepta |
|---|---|
| El registro responde 409 `EMAIL_TAKEN` y eso revela que la cuenta existe | El enunciado pide un error claro para el email duplicado. Se limita con el rate limit de registro por IP |
| Si la respuesta de `POST /auth/rotate` se pierde (corte de red justo después de rotar), el token viejo ya quedó revocado y el usuario vuelve al login | Es poco probable y la consecuencia es solo volver a ingresar. La alternativa (período de gracia del token viejo) agrega complejidad |
| El login no exige email verificado | La verificación es un extra y no debe romper el flujo obligatorio; Home muestra el aviso |
| Rate limit en memoria | Se resetea al reiniciar y no se comparte entre instancias. En producción haría falta un store compartido (por ejemplo Redis) |
| `trust proxy` no está configurado | Detrás de un proxy todas las requests tendrían la IP del proxy y el límite por IP sería global. Hay que configurarlo según el despliegue |
| HTTP en la LAN | Solo para desarrollo. En producción, HTTPS obligatorio |
| La imagen de Docker es de desarrollo | Corre TypeScript con `tsx` y `NODE_ENV=development` (Swagger visible). No es una imagen de producción |
| Los mails salen por SMTP sin TLS hacia Mailpit | Mailpit es local. En producción haría falta un proveedor con TLS y SPF/DKIM |
