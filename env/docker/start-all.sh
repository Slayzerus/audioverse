#!/usr/bin/env bash
set -Eeuo pipefail

# Użyj: NETWORK_NAME=my-net ./start-all.sh
NETWORK_NAME="${NETWORK_NAME:-audioverse-net}"

ensure_network() {
  if ! docker network ls --filter "name=^${NETWORK_NAME}$" --format "{{.Name}}" | grep -q "^${NETWORK_NAME}$"; then
    echo "Creating docker network: $NETWORK_NAME"
    docker network create "$NETWORK_NAME" >/dev/null
  else
    echo "Docker network '$NETWORK_NAME' already exists."
  fi
}

export COMPOSE_PROFILES="${COMPOSE_PROFILES:-core,aiaudio,aivideo}"

main() {
  ensure_network

  shopt -s nullglob
  files=(docker-compose.*.yml)
  if ((${#files[@]} == 0)); then
    echo "No docker-compose.<abc>.yml files found in current directory."
    exit 0
  fi

  for file in "${files[@]}"; do
    echo "Starting $file ..."
    docker compose -f "$file" up -d
  done

  echo "All docker-compose.*.yml started."
}

main "$@"
