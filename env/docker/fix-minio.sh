#!/bin/bash
# Add MinIO service to production docker-compose.yml
# Run from /home/audioverse/docker/
set -e

COMPOSE_FILE="docker-compose.yml"

# Check if minio already exists
if grep -q "^\s*minio:" "$COMPOSE_FILE" 2>/dev/null; then
    echo "MinIO service already exists in $COMPOSE_FILE"
else
    # Insert minio service before "react:" line
    sed -i '/^  react:/i \
  minio:\
    image: minio/minio:latest\
    container_name: av-minio\
    restart: unless-stopped\
    environment:\
      MINIO_ROOT_USER: minio\
      MINIO_ROOT_PASSWORD: minio123\
    command: server /data --console-address ":9001"\
    ports:\
      - "9000:9000"\
      - "9001:9001"\
    volumes:\
      - ./data/minio:/data\
    networks: [audioverse-net]\
    healthcheck:\
      test: ["CMD", "mc", "ready", "local"]\
      interval: 10s\
      timeout: 5s\
      retries: 5\
    logging: *default-logging\
' "$COMPOSE_FILE"
    echo "MinIO service added to $COMPOSE_FILE"
fi

# Start minio, then restart API so it connects
docker compose up -d minio
echo "Waiting for MinIO to start..."
sleep 8
docker compose restart api
echo "Waiting for API to start..."
sleep 10
docker compose up -d --force-recreate react
sleep 5
docker ps | grep -E "minio|api|react"
echo "Done!"
