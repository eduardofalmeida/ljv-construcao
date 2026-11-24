#!/usr/bin/env bash
# Rode NO MAC (com Docker Desktop). Compila lá (tem RAM) e envia as imagens para a VPS.
# Uso: bash deploy/ship-from-mac.sh
set -euo pipefail
# A VPS é x86_64 (amd64); Macs com chip M geram arm64 por padrão, por isso o --platform.
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VPS="${VPS:-root@177.153.22.65}"
REMOTE_DIR="${REMOTE_DIR:-/opt/ljv-construcao}"

echo "==> Build backend no Mac (Maven dentro do Docker — Mac aguenta)"
docker build --platform linux/amd64 -t ljv-backend:latest -f backend/Dockerfile backend/

echo "==> Build frontend no Mac"
docker build --platform linux/amd64 -t ljv-frontend:latest frontend/

echo "==> Enviando imagens para a VPS ($VPS) — pode demorar alguns minutos"
docker save ljv-backend:latest ljv-frontend:latest | gzip -1 | ssh "$VPS" 'gunzip | docker load'

echo "==> Subindo stack na VPS (sem compilar nada lá)"
ssh "$VPS" "cd $REMOTE_DIR && git pull origin main && bash deploy/ensure-swap.sh && docker compose -f docker-compose.prod.yml --env-file .env.prod up -d"

echo "==> Status"
ssh "$VPS" "cd $REMOTE_DIR && docker compose -f docker-compose.prod.yml --env-file .env.prod ps"

echo
echo "Pronto. Abra http://177.153.22.65/login"
