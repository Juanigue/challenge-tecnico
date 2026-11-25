# Imagen para desarrollo local con docker compose (HTTP, Swagger visible).
# No es una imagen de producción: corre TypeScript con tsx, sin build previo.
FROM node:24-slim

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations

# La base SQLite vive en /app/data, montado como volumen por docker compose.
RUN mkdir -p data && chown node:node data
USER node

EXPOSE 3000
CMD ["./node_modules/.bin/tsx", "src/server.ts"]
