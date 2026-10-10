# Contexto de build: raiz do repositório.
#   docker build -f apps/frontend/Dockerfile -t jogae-web .
# O front é buildado para falar com a API em /api (mesmo hostname, sem CORS).
# O servidor (server/server.ts) não tem dependências: só Node.

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npm ci --workspace=apps/frontend --include-workspace-root
COPY apps/frontend apps/frontend
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build --workspace=apps/frontend

FROM node:24-alpine AS runtime
ENV NODE_ENV=production PORT=8080 API_INTERNAL_URL=http://jogae-api:3000
WORKDIR /app
COPY --from=build --chown=node:node /app/apps/frontend/dist ./dist
COPY --chown=node:node apps/frontend/edge ./edge
COPY --chown=node:node apps/frontend/server ./server
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
CMD ["node", "server/server.ts"]
