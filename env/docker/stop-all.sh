#!/usr/bin/env bash
set -Eeuo pipefail

echo "=== Stopping all services ==="
docker compose --profile aiaudio --profile videoai --profile admin down --remove-orphans
echo "=== Done ==="
