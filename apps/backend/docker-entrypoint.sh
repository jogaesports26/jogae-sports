#!/bin/sh
# Aplica as migrações pendentes e sobe a API. Falha (e o container reinicia) se a migração falhar.
set -eu
node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
exec node dist/main
