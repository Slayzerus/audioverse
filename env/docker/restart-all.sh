x#!/usr/bin/env bash
set -Eeuo pipefail

# U¿yj: NETWORK_NAME=my-net ./restart-all.sh
NETWORK_NAME="${NETWORK_NAME:-audioverse-net}"

ensure_network() {
  if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    echo "Creating docker network: $NETWORK_NAME"
    docker network create "$NETWORK_NAME" >/dev/null
  else
    echo "Docker network '$NETWORK_NAME' already exists."
  fi
}

main() {
  ensure_network

  shopt -s nullglob
  files=(docker-compose.*.yml)
  if ((${#files[@]} == 0)); then
    echo "No docker-compose.<abc>.yml files found in current directory."
    exit 0
  fi

  for file in "${files[@]}"; do
    echo "Restarting $file ..."
    docker compose -f "$file" down --remove-orphans
    docker compose -f "$file" up -d
  done

  echo "All docker-compose.*.yml restarted."
}

main "$@"
