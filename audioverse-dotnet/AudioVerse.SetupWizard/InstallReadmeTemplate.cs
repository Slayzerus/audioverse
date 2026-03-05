namespace AudioVerse.SetupWizard;

public static class InstallReadmeTemplate
{
    public static string Generate(WizardOptions opts) => $"""
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
        | MinIO (Karaoke) | {(opts.EnableKaraoke ? "✅" : "❌")} |
        | Elasticsearch | {(opts.EnableElasticsearch ? "✅" : "❌")} |
        | Kafka | {(opts.EnableKafka ? "✅" : "❌")} |
        | utils/ai/ Audio | {(opts.HasAnyAiAudio ? "✅" : "❌")} |
        | utils/ai/ Video | {(opts.HasAnyAiVideo ? "✅" : "❌")} |
        | utils/ Librosa | {(opts.EnableLibrosa ? "✅" : "❌")} |
        | AI Motion | {(opts.HasAnyAiMotion ? "✅" : "❌")} |
        | Generative (Images) | {(opts.HasAnyGenImage ? "✅" : "❌")} |
        | Generative (3D) | {(opts.HasAnyGen3D ? "✅" : "❌")} |
        | Generative (Audio/SFX) | {(opts.HasAnyGenAudio ? "✅" : "❌")} |
        | Generative (Voice/TTS) | {(opts.HasAnyGenVoice ? "✅" : "❌")} |

        ## Management

        ```bash
        dotnet run --project AudioVerse.SetupWizard manage
        ```

        ## Security Notes
        - Rotate passwords in `.env` before production deployment.
        - Never commit `./secrets/` directory to version control.
        - Use `--certbot` flag to enable automatic Let's Encrypt certificates.
        """;
}
