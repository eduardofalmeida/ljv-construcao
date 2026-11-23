#!/usr/bin/env bash
# Sobe a stack na VPS SEM compilar Java/Node (usa imagens já prontas).
# Imagens: enviadas pelo Mac (deploy/ship-from-mac.sh) ou puxadas do GHCR.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.prod}"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Falta $ENV_FILE — copie de .env.prod.example e defina POSTGRES_PASSWORD"
  exit 1
fi

# shellcheck disable=SC1090
set -a
# carrega só para ler BACKEND_IMAGE (sem exportar senha à toa em logs)
source "$ENV_FILE"
set +a

bash deploy/ensure-swap.sh

BACKEND_IMAGE="${BACKEND_IMAGE:-ljv-backend:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-ljv-frontend:latest}"

if [[ "$BACKEND_IMAGE" == ghcr.io/* ]] || [[ "$FRONTEND_IMAGE" == ghcr.io/* ]]; then
  echo "==> Login GHCR (se o pacote for privado)"
  if [[ -n "${GHCR_TOKEN:-}" ]]; then
    echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-eduardofalmeida}" --password-stdin
  fi
  echo "==> Pull das imagens"
  docker pull "$BACKEND_IMAGE"
  docker pull "$FRONTEND_IMAGE"
else
  if ! docker image inspect "$BACKEND_IMAGE" >/dev/null 2>&1; then
    echo "Imagem $BACKEND_IMAGE não encontrada nesta VPS."
    echo "NÃO compile aqui (trava a máquina de 4GB)."
    echo "No Mac, rode:  bash deploy/ship-from-mac.sh"
    exit 1
  fi
  if ! docker image inspect "$FRONTEND_IMAGE" >/dev/null 2>&1; then
    echo "Imagem $FRONTEND_IMAGE não encontrada nesta VPS."
    echo "No Mac, rode:  bash deploy/ship-from-mac.sh"
    exit 1
  fi
fi

echo "==> Subindo Postgres + backend + frontend"
"${COMPOSE[@]}" up -d

echo "==> Status"
"${COMPOSE[@]}" ps
echo
echo "Site: http://177.153.22.65  |  http://www.ljvconstrucao.com.br"
echo "Login: admin / admin123"
