import { createApp } from './app.js';
import { deleteExpiredSessions } from './auth/sessions.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db/connection.js';
import { runMigrations } from './db/migrate.js';

const config = loadConfig();
const db = openDatabase(config.DATABASE_PATH);

const applied = runMigrations(db);
if (applied.length) console.log(`Migraciones aplicadas: ${applied.join(', ')}`);

const removed = deleteExpiredSessions(db);
console.log(`Sesiones vencidas eliminadas: ${removed}`);

const server = createApp(db, config).listen(config.PORT, () => {
  console.log(`WOD API escuchando en el puerto ${config.PORT} (${config.NODE_ENV})`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
