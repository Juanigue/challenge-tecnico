# Checklist manual de QA

## Fase 2: sesión en Expo Go (iPhone)

### Preparación
1. PC y iPhone en la misma red Wi-Fi.
2. Hacen falta **dos terminales abiertas a la vez**. En la primera, el backend: `cd backend && npm run dev`, que tiene que decir `WOD API escuchando en el puerto 3000`. Si el backend no está corriendo, la app muestra "El servidor tardó demasiado en responder".
3. La primera vez, Windows puede preguntar si permite a Node.js en redes privadas: aceptar. Si no preguntó y el teléfono no conecta, habilitar el puerto 3000 en el Firewall de Windows (red privada).
4. En la segunda terminal, mobile: `cd mobile && npx expo start`, y escanear el QR con la cámara del iPhone.
5. Si Expo Go pide permiso de "Red local", aceptarlo.
6. Sin `mobile/.env`, la app usa la IP de la PC que muestra Metro con el puerto 3000. Si falla, crear `mobile/.env` con `EXPO_PUBLIC_API_URL=http://<IP-de-la-PC>:3000` y reiniciar `expo start`.

### Casos
| ID | Pasos | Esperado | Resultado |
|---|---|---|---|
| F-01 | Registrarse con datos válidos y términos aceptados | Va al login con "Cuenta creada. Ingresá con tu contraseña." y el email precargado. El backend muestra solo `POST /auth/register 201` (todavía no hay sesión). El gesto de volver no regresa al formulario | OK (iPhone, Expo Go, 25/11) |
| F-05 | Desde ahí, ingresar la contraseña y tocar "Ingresar" | Entra a Home con nombre, email y "Sesión activa hasta" | OK (iPhone, Expo Go, 25/11) |
| F-02 | Registrarse otra vez con el mismo email (probar con mayúsculas) | Error "Ya existe una cuenta con ese email" en el campo email | OK (iPhone, Expo Go, 25/11) |
| F-03 / F-04 | Contraseñas distintas, de menos de 12 caracteres, o términos sin aceptar | Error en el campo y no se envía nada (el log del backend no muestra `POST /auth/register`) | OK (iPhone, Expo Go, 25/11) |
| F-06 | Login con contraseña incorrecta | "Email o contraseña incorrectos" | OK (iPhone, Expo Go, 25/11) |
| F-07 | Con sesión iniciada, cerrar Expo Go desde el selector de apps y volver a abrir el proyecto | Splash y después Home directo, sin que aparezca el login en el medio | OK (iPhone, Expo Go, 25/11) |
| F-09 | En Home, tocar "Cerrar sesión" y después hacer el gesto de volver desde el borde izquierdo | Queda en el login; el gesto no vuelve a Home. El backend muestra `POST /auth/logout 204` | OK (iPhone, Expo Go, 25/11) |
| F-09 (sin red) | Con sesión iniciada, cortar el backend (Ctrl+C) y tocar "Cerrar sesión" | Error de red ("No pudimos conectar con el servidor…" o, si el firewall descarta la conexión, "El servidor tardó demasiado…" a los 10 s) y sigue en Home. Levantar el backend y reintentar: cierra la sesión | OK (iPhone, Expo Go, 25/11) |
| F-10 | Con sesión iniciada, cortar el backend y reabrir la app | Pantalla "No pudimos conectar con el servidor" con Reintentar, sin mostrar Home. Levantar el backend y tocar Reintentar: entra a Home | OK (iPhone, Expo Go, 25/11) |
| F-10 (login) | Sin sesión y con el backend cortado, intentar ingresar | Error de red controlado; la app no se cuelga | OK (iPhone, Expo Go, 25/11) |
| F-11 | Tocar "Ingresar" o "Crear cuenta" varias veces rápido | Un solo request en el log del backend | OK (iPhone, Expo Go, 25/11) |
| S-02 | Con sesión iniciada, revocarla a mano en la BD (`UPDATE sessions SET revoked_at = 1;` con DB Browser) y reabrir la app | Vuelve al login | OK (iPhone, Expo Go, 25/11) |

## Fase 3: diseño (iPhone con Expo Go; Android si hay dispositivo o emulador)

Misma preparación que la Fase 2 (backend y Metro en dos terminales). Como cambió `app.json` (modo oscuro y color del splash), reiniciar `npx expo start`.

| Pantalla / caso | Pasos | Esperado | Resultado |
|---|---|---|---|
| Bienvenida | Abrir la app sin sesión | Logo WOD, ilustración, "Tu método, más potente." y los botones "Crear cuenta" e "Iniciar sesión". Nada tapado por el notch ni por la barra de inicio | ⏳ |
| Bienvenida, pantalla chica | Rotación fija vertical; probar en el iPhone más chico disponible o con texto grande | La ilustración se achica y los dos botones se ven o se alcanzan haciendo scroll | ⏳ |
| Navegación | Crear cuenta → flecha de volver; Iniciar sesión → flecha de volver | Las dos flechas vuelven a la bienvenida | ⏳ |
| Logos | Mirar la bienvenida, el login, el registro y Home | Wordmark y emblema PNG nítidos, sin fondo blanco alrededor | ⏳ |
| Registro: teclado | Completar los campos usando "Siguiente" del teclado | Pasa de campo en campo; el teclado nunca tapa el campo activo | ⏳ |
| Registro: contraseña | Escribir una frase larga y tocar el ojo | Contador "(n/12)" hasta llegar a 12 y después "n caracteres ✓"; el ojo muestra y oculta | ⏳ |
| Registro: términos | Tocar "términos y condiciones" | Modal con "Texto demostrativo, no es un documento legal"; "Entendido" vuelve al formulario sin perder lo escrito | ⏳ |
| Registro: carga y errores | Enviar con errores; después enviar válido | Errores en rojo junto a cada campo; al enviar, spinner en el botón y "Creando tu cuenta…"; después login con el aviso verde | ⏳ |
| Login | Email y contraseña con autocompletado de iOS (llavero) | Ofrece el email/contraseña guardados; "Entrar a WOD" muestra carga y "Validando tus credenciales…" | ⏳ |
| Home | Entrar | Fecha, saludo según la hora, tarjeta "Tu sesión" (Activa y vencimiento), "Mis alumnos" y "Rutinas" con etiqueta Demo, "Mi perfil" con datos reales | ⏳ |
| Logout | "Cerrar sesión" | Spinner en el botón y vuelve al login; el gesto de volver no regresa a Home | ⏳ |
| Sin conexión | Con sesión, cortar el backend y reabrir la app | Tarjeta glass "No pudimos conectar con el servidor" con Reintentar | ⏳ |
| Glass (iOS) | Mirar las tarjetas sobre el fondo | Se nota el desenfoque y el texto se lee bien | ⏳ |
| Reducir transparencia (iOS) | Ajustes → Accesibilidad → Pantalla y tamaño de texto → Reducir transparencia; volver a la app | Las tarjetas pasan a un fondo sólido verde oscuro, sin blur | ⏳ |
| Reducir movimiento (iOS) | Ajustes → Accesibilidad → Movimiento → Reducir movimiento | Sin animaciones de entrada ni escala en botones; la barra de carga queda fija | ⏳ |
| Android | Repetir Bienvenida, Registro, Login y Home | Tarjetas con fondo sólido (sin blur), mismos textos y estados | ⏳ (sin dispositivo) |

## Fase 4: extras

### Preparación
1. Los mails (código de recuperación y de verificación) van a **Mailpit**, una bandeja local. Opciones:
   - Con Docker: `docker compose up mailpit` desde la raíz del repo. Bandeja en http://localhost:8025.
   - Sin Docker: bajar el binario de Mailpit para Windows desde sus releases de GitHub y ejecutarlo; usa los mismos puertos (SMTP 1025, bandeja 8025).
   - Sin Mailpit, el backend loguea `[mail] envío fallido: …` y el resto funciona, pero no se puede obtener el código.
2. El backend necesita la migración nueva: `npm run dev` la aplica sola al arrancar (`Migraciones aplicadas: 002_extras.sql`).
3. Como cambió `app.json` (`userInterfaceStyle: automatic`), reiniciar `npx expo start`.

### Casos
| Caso | Pasos | Esperado | Resultado |
|---|---|---|---|
| Verificación: aviso | Crear una cuenta nueva e ingresar | Home muestra la tarjeta "Verificá tu email" con "Ingresar código". En Mailpit llegó "WOD: verificá tu email" con un código de 6 dígitos | ⏳ |
| Verificación: código | Tocar "Ingresar código", escribir el código de Mailpit y "Verificar" | Vuelve a Home y el aviso desaparece | ⏳ |
| Verificación: reenviar | En la pantalla de verificación, "Reenviar código" | Aviso "Te enviamos un código nuevo."; el código anterior ya no sirve | ⏳ |
| Recuperación: pedir código | Login → "¿Olvidaste tu contraseña?" → email → "Enviar código" | Pasa al paso 2. Llega el mail a Mailpit solo si la cuenta existe; con un email inexistente la app muestra lo mismo | ⏳ |
| Recuperación: cambiar | Código, contraseña nueva y confirmación → "Cambiar contraseña" | Vuelve al login con "Contraseña actualizada…" y el email precargado; la contraseña vieja ya no sirve y la nueva sí | ⏳ |
| Recuperación: cierra sesiones | Con sesión abierta en el teléfono, hacer el reset desde Swagger (`/docs`) o desde otro dispositivo; reabrir la app | Vuelve al login (la sesión fue revocada) | ⏳ |
| Recuperación: código incorrecto | Escribir un código equivocado | "Código inválido o vencido"; al 5.º intento fallido el código queda bloqueado aunque después se escriba el correcto | ⏳ |
| Perfil | Home → "Editar perfil" → cambiar el nombre → "Guardar cambios" | "Perfil actualizado."; al volver, Home saluda con el nombre nuevo. Sin cambios el botón queda deshabilitado | ⏳ |
| Sesiones | Ingresar con la misma cuenta desde Swagger o un segundo dispositivo; en el teléfono, Home → "Sesiones abiertas" | Lista con "Este dispositivo" (`WOD ios (iPhone …)`) y la otra sesión | ⏳ |
| Sesiones: revocar una | "Cerrar sesión en …" sobre la otra sesión | Desaparece de la lista; su token da 401 | ⏳ |
| Sesiones: cerrar todas | "Cerrar sesión en todos los dispositivos" | Vuelve al login; el gesto de volver no regresa a Home; las otras sesiones también quedan revocadas | ⏳ |
| Rotación | En `backend/.env` poner `SESSION_TTL_HOURS=1`, reiniciar el backend, ingresar, esperar entre 31 y 59 min y reabrir la app (después de 60 min la sesión ya venció y vuelve al login) | Entra a Home y el log del backend muestra `POST /auth/rotate 200` | ⏳ |
| Modo claro | Ajustes → Pantalla y brillo → Claro; recorrer bienvenida, login, registro, Home, perfil y sesiones | Fondo claro, textos oscuros legibles, logo en verde oscuro, barra de estado con íconos oscuros, blur claro en las tarjetas | ⏳ |
| Botón de tema | Tocar el sol/luna del encabezado en bienvenida, login, registro, Home, perfil y sesiones | Cambia de modo al instante, también el teclado y la barra de estado; el ícono pasa a ofrecer el modo contrario | ⏳ |
| Botón de tema: persistencia | Elegir el modo contrario al de iOS, cerrar Expo Go y reabrir | Arranca directo en el modo elegido, sin mostrar antes el del sistema | ⏳ |
| Cambio en vivo | Sin haber tocado nunca el botón de tema (si ya se tocó, la app queda en el modo elegido), con la app abierta cambiar entre claro y oscuro desde el Centro de control | La app cambia de tema sin reiniciarse | ⏳ |
| Swagger | Abrir http://localhost:3000/docs en la PC | Documentación con los 12 endpoints; "Authorize" con el token permite probar los privados | ⏳ |
| Docker | `docker compose up --build` desde la raíz | Backend en :3000 y Mailpit en :8025; los datos persisten tras `docker compose down` y `up` | ⏳ (Docker no instalado en la PC) |
