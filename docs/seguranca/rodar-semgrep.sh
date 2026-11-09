#!/usr/bin/env bash
# Uso: docs/seguranca/rodar-semgrep.sh <antes|depois>
# Requer: pip install semgrep (venv). Métricas desligadas.
set -euo pipefail
cd "$(dirname "$0")/../.."
FASE="${1:?antes|depois}"
OUT="docs/seguranca/evidencias/semgrep-$FASE"
export SEMGREP_SEND_METRICS=off SEMGREP_ENABLE_VERSION_CHECK=0
SEMGREP="${SEMGREP:-semgrep}"
REGRAS=(
  --config p/owasp-top-ten --config p/javascript --config p/typescript \
  --config p/nodejs --config p/react --config p/security-audit \
  --config p/secrets --config p/sql-injection --config p/command-injection --config p/xss \
  --exclude node_modules --exclude dist --exclude data --exclude docs --exclude '*.min.js' \
)
"$SEMGREP" scan --metrics=off "${REGRAS[@]}" --json --output "$OUT.json" . || true
"$SEMGREP" scan --metrics=off "${REGRAS[@]}" --output "$OUT.txt" . || true
"$SEMGREP" --version > "$OUT-versao.txt"
