# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Instala dependencias (incluye devDependencies para compilar TypeScript)
COPY package.json package-lock.json ./
RUN npm ci

# Compila el proyecto (tsc -> dist/)
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Solo dependencias de producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Artefactos compilados
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
