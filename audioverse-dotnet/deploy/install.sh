#!/usr/bin/env bash
set -euo pipefail

# Simple installer script for AudioVerse on Debian/Ubuntu systems
# Usage: install.sh /path/to/deploy_dir [--apply]

# Modes:
#   no args - only ensure docker present and print status
#   --apply  - perform docker compose pull && docker compose up -d --force-recreate

DEPLOY_DIR=${1:-/home/audioverse}
APPLY_MODE=false
if [ "${2:-}" = "--apply" ] || [ "${1:-}" = "--apply" ]; then
  APPLY_MODE=true
fi

echo "AudioVerse installer starting — deploy dir: ${DEPLOY_DIR}"

command_exists() { command -v "$1" >/dev/null 2>&1; }

if command_exists docker; then
  echo "Docker already installed"
else
  echo "Docker not found — installing Docker Engine..."
  # Install prerequisites
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg lsb-release

  sudo mkdir -p /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(. /etc/os-release && echo \"$ID\") \
    $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin || {
    echo "Failed to install docker packages via apt, trying convenience script"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
  }

  sudo systemctl enable --now docker || true
  echo "Docker installed"
fi

if ! command_exists docker; then
  echo "Docker still not available — aborting"
  exit 1
fi

echo "Ensuring current user can use docker (may require logout/login)"
if [ "$SUDO_USER" != "" ]; then
  TARGET_USER=$SUDO_USER
else
  TARGET_USER=$(whoami)
fi
sudo usermod -aG docker "${TARGET_USER}" || true

# Start services if compose file exists
if [ -f "${DEPLOY_DIR}/docker/docker-compose.yml" ] || [ -f "${DEPLOY_DIR}/docker/docker-compose.yaml" ]; then
  echo "Found docker-compose file — working in ${DEPLOY_DIR}/docker"
  cd "${DEPLOY_DIR}/docker"
  if [ "$APPLY_MODE" = true ]; then
    echo "Apply mode: pulling images and recreating containers"
    sudo docker compose pull || true
    sudo docker compose up -d --force-recreate || { echo "docker compose up failed"; exit 1; }
  else
    echo "Non-apply mode: ensuring containers are up"
    sudo docker compose up -d || true
  fi
  echo "Docker compose operations completed"
elif [ -f "${DEPLOY_DIR}/docker/restart-all.sh" ]; then
  echo "Found restart-all.sh — executing"
  sudo chmod +x "${DEPLOY_DIR}/docker/restart-all.sh"
  sudo "${DEPLOY_DIR}/docker/restart-all.sh"
else
  echo "No docker compose or restart script found in ${DEPLOY_DIR}/docker — nothing to start"
fi

echo "Installer finished"

# Health check: ensure API is listening on configured port
API_PORT=5000
if [ -f "${DEPLOY_DIR}/.env" ]; then
  # try to read API port override
  PORT_LINE=$(grep -E "^API_PORT=" "${DEPLOY_DIR}/.env" || true)
  if [ -n "$PORT_LINE" ]; then
    API_PORT=${PORT_LINE#API_PORT=}
  fi
fi

echo "Waiting for API to be available on port ${API_PORT}..."
WAIT_SECS=15
TRIES=8
SLEEP=3
success=false
for i in $(seq 1 $TRIES); do
  if nc -zv 127.0.0.1 "$API_PORT" >/dev/null 2>&1; then
    echo "API port ${API_PORT} is open"
    success=true
    break
  fi
  echo "Attempt $i: API not open yet, waiting $SLEEP seconds..."
  sleep $SLEEP
done

if [ "$success" = false ]; then
  echo "API did not become available on port ${API_PORT}"
  if [ "$APPLY_MODE" = true ]; then
    echo "Apply mode failed: attempting rollback (docker compose down)"
    sudo docker compose down || true
  fi
  exit 2
fi

echo "Health check passed"
