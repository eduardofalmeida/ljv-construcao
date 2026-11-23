#!/usr/bin/env bash
# Sobe a stack de produção na VPS 4GB na ordem segura (sem build paralelo).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE — copie de .env.prod.example e defina POSTGRES_PASSWORD"
  exit 1
fi

echo "==> Swap"
bash deploy/ensure-swap.sh

echo "==> Postgres"
"${COMPOSE[@]}" up -d postgres
"${COMPOSE[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER:-ljv_user}" -d "${POSTGRES_DB:-ljv_construcao}" || true

echo "==> Compilar backend (fora do Docker)"
bash deploy/build-backend.sh

echo "==> Imagem backend (leve)"
"${COMPOSE[@]}" build backend

echo "==> Imagem frontend"
"${COMPOSE[@]}" build frontend

echo "==> Subir stack"
"${COMPOSE[@]}" up -d

echo "==> Status"
"${COMPOSE[@]}" ps
echo
echo "Aguardando backend healthy (até ~2 min)..."
for i in $(seq 1 30); do
  if "${COMPOSE[@]}" exec -T backend curl -fsS http://127.0.0.1:8080/api/actuator/health/liveness >/dev/null 2>&1; then
    echo "Backend OK"
    break
  fi
  sleep 4
done

"${COMPOSE[@]}" ps
echo
echo "Site: http://177.153.22.65  |  http://www.ljvconstrucao.com.br"
echo "Login: admin / admin123 (troque depois)"
