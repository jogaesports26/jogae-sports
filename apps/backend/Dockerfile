# Contexto de build: raiz do repositório (monorepo com workspaces).
#   docker build -f apps/backend/Dockerfile -t jogae-api .
# Sem segredos na imagem: DATABASE_URL, DIRECT_URL, JWT_SECRET etc. chegam só em tempo de execução.

FROM node:24-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npm ci --workspace=apps/backend --include-workspace-root
COPY apps/backend apps/backend
RUN cd apps/backend && node_modules/.bin/prisma generate && cd ../.. && npm run build --workspace=apps/backend

FROM node:24-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npm ci --omit=dev --workspace=apps/backend --include-workspace-root \
 && npm cache clean --force
COPY apps/backend/prisma apps/backend/prisma
RUN cd apps/backend && node_modules/.bin/prisma generate

FROM node:24-alpine AS runtime
ENV NODE_ENV=production TZ=America/Sao_Paulo PORT=3000
RUN apk add --no-cache openssl tzdata
WORKDIR /app/apps/backend
COPY --from=deps --chown=node:node /app/node_modules /app/node_modules
COPY --from=deps --chown=node:node /app/apps/backend/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/backend/dist ./dist
COPY --chown=node:node apps/backend/prisma ./prisma
COPY --chown=node:node apps/backend/package.json ./
COPY --chown=node:node apps/backend/docker-entrypoint.sh ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1
CMD ["./docker-entrypoint.sh"]
