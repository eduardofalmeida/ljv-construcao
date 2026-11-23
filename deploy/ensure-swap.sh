#!/usr/bin/env bash
# Garante 4G de swap — obrigatório na VPS 4GB antes de compilar.
set -euo pipefail

SWAPFILE="${SWAPFILE:-/swapfile}"
SIZE_GB="${SWAP_SIZE_GB:-4}"

if swapon --show | grep -q .; then
  echo "Swap já ativo:"
  free -h
  exit 0
fi

echo "Criando swap ${SIZE_GB}G em ${SWAPFILE}..."
swapoff "$SWAPFILE" 2>/dev/null || true
rm -f "$SWAPFILE"
fallocate -l "${SIZE_GB}G" "$SWAPFILE" || dd if=/dev/zero of="$SWAPFILE" bs=1M count=$((SIZE_GB * 1024))
chmod 600 "$SWAPFILE"
mkswap "$SWAPFILE"
swapon "$SWAPFILE"
grep -q "$SWAPFILE" /etc/fstab || echo "$SWAPFILE none swap sw 0 0" >> /etc/fstab
free -h
