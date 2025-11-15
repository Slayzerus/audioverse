#!/usr/bin/env bash
set -Eeuo pipefail

shopt -s nullglob
files=(docker-compose.*.yml)
if ((${#files[@]} == 0)); then
  echo "No docker-compose.<abc>.yml files found in current directory."
  exit 0
fi

for file in "${files[@]}"; do
  echo "Stopping $file ..."
  docker compose -f "$file" down --remove-orphans
done

echo "All docker-compose.*.yml stopped."
