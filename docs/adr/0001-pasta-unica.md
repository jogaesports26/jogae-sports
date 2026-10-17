# ADR 0001: Código e produção na mesma pasta

- Data: 2026-10-10
- Status: Aceita (reavaliar com clientes)

## Contexto
Ainda não há clientes e o objetivo é deixar o Jogaê completo e padronizado, com agilidade.

## Decisão
O código fica em /srv/apps/jogae; o build é local (./publicar.sh), sem GitHub Actions nem GHCR no caminho; commit direto na main.

## Consequências
Menos atrito para publicar. Risco de erro de edição afetar produção, mitigado por testes, backup e rollback automático. Reavaliar ao ter clientes (criar ambiente de desenvolvimento separado).
