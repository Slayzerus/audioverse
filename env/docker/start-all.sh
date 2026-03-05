#!/usr/bin/env bash
set -Eeuo pipefail

NETWORK_NAME="${NETWORK_NAME:-audioverse-net}"

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
  echo "Creating docker network: $NETWORK_NAME"
  docker network create "$NETWORK_NAME" >/dev/null
fi

echo "=== Starting infra + app ==="
docker compose up -d

echo "=== Starting AI Audio ==="
docker compose --profile aiaudio up -d

echo "=== Done ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
