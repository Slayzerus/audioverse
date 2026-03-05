# AudioVerse — Deployment Guide

## Requirements
- Docker & Docker Compose v2+
- (Optional) NVIDIA GPU + nvidia-docker for AI services

## Quick Start

```bash
# 1. Start all services
docker compose up -d

# 2. Apply database migrations
docker compose exec api dotnet ef database update \
  --project AudioVerse.Infrastructure \
  --startup-project AudioVerse.API

# 3. (Optional) Seed initial data
docker compose exec api dotnet run --project AudioVerse.API -- seed
```

## Selected Configuration

| Component | Status |
|---|---|
| PostgreSQL | ✅ Always |
| Redis | ✅ Always |
| Nginx + SSL | ✅ Always |
| MinIO (Karaoke) | ✅ |
| Elasticsearch | ❌ |
| Kafka | ❌ |
| utils/ai/ Audio | ✅ |
| utils/ai/ Video | ❌ |
| utils/ Librosa | ✅ |
| AI Motion | ❌ |
| Generative (Images) | ❌ |
| Generative (3D) | ❌ |
| Generative (Audio/SFX) | ❌ |
| Generative (Voice/TTS) | ❌ |

## Management

```bash
dotnet run --project AudioVerse.SetupWizard manage
```

## Security Notes
- Rotate passwords in `.env` before production deployment.
- Never commit `./secrets/` directory to version control.
- Use `--certbot` flag to enable automatic Let's Encrypt certificates.