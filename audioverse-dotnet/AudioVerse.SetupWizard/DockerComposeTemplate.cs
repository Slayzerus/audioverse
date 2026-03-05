using System.Text;

namespace AudioVerse.SetupWizard;

public static class DockerComposeTemplate
{
    public static string Generate(WizardOptions opts, bool useDockerSecrets = false)
    {
        var sb = new StringBuilder();
        sb.AppendLine("services:");

        // ── Essential ──
        AppendPostgres(sb);
        AppendRedis(sb);
        AppendMailHog(sb);
        AppendAdminer(sb);

        if (opts.EnableKaraoke)
            AppendMinio(sb);

        // In Debug mode the API is run from Visual Studio — not containerized
        if (!opts.DebugMode)
        {
            AppendApi(sb, opts);
            AppendIdentity(sb);
            AppendReact(sb);
            AppendNginx(sb);
        }

        // ── Optional infrastructure ──
        if (opts.EnableElasticsearch) AppendElasticsearch(sb);
        if (opts.EnableKafka) AppendKafka(sb);

        // ── AI Audio ──
        // ── utils/ai/ — Audio sidecar services ──
        if (opts.EnableAudioAnalysis) AppendUtilsService(sb, "audio_analysis", 8081, "Audio Analysis (BPM, key)");
        if (opts.EnableAudioPitch && opts.AudioPitchGpu)
            AppendUtilsGpuService(sb, "audio_pitch", 8084, "Audio Pitch Tracking (CREPE + pYIN, GPU)", opts, "Dockerfile.gpu");
        else if (opts.EnableAudioPitch)
            AppendUtilsService(sb, "audio_pitch", 8084, "Audio Pitch Tracking (CREPE + pYIN, CPU)");
        if (opts.EnableAudioRhythm) AppendUtilsService(sb, "audio_rhythm", 8083, "Audio Rhythm / Beat");
        if (opts.EnableAudioSeparate) AppendUtilsService(sb, "audio_separate", 8086, "Source Separation (Demucs, CPU)");
        if (opts.EnableAudioTags) AppendUtilsService(sb, "audio_tags", 8087, "Audio Tags");
        if (opts.EnableAudioTagsPanns) AppendUtilsService(sb, "audio_tags_panns", 8000, "Audio Tags PANNs");
        if (opts.EnableAudioVad) AppendUtilsService(sb, "audio_vad", 8085, "Voice Activity Detection");
        if (opts.EnableSingScore) AppendUtilsService(sb, "sing_score", 8082, "Singing Score");
        if (opts.EnableAudioCraft) AppendUtilsGpuService(sb, "audiocraft", 7861, "AudioCraft / MusicGen", opts);
        if (opts.EnableRiffusion) AppendUtilsService(sb, "riffusion", 7860, "Riffusion");
        if (opts.EnableWaveGan) AppendUtilsService(sb, "wavegan", 8088, "WaveGAN");

        // ── utils/ai/ — Video sidecar services ──
        if (opts.EnableMediaPipe) AppendUtilsGpuService(sb, "mediapipe", 8093, "MediaPipe Pose", opts);
        if (opts.EnableOpenPose) AppendUtilsGpuService(sb, "openpose", 8092, "OpenPose", opts);
        if (opts.EnableAlphaPose) AppendUtilsGpuService(sb, "alphapose", 8103, "AlphaPose", opts);
        if (opts.EnableVitPose) AppendUtilsService(sb, "vitpose", 8094, "ViTPose");
        if (opts.EnablePoseFormer) AppendUtilsGpuService(sb, "poseformer", 8095, "PoseFormer 3D", opts);

        // ── utils/librosa ──
        if (opts.EnableLibrosa) AppendServiceWithPorts(sb, "librosa", 8088, 8000, "Librosa audio features", "./utils/librosa");

        // ── AI Motion (API/Env/ai-motion/) — local only if no remote GPU ──
        if (opts.GpuMode == RemoteGpuMode.None)
        {
            if (opts.EnableMotionGpt) AppendGpuService(sb, "motion_gpt", "audioverse/motion-gpt:latest", 8300, "MotionGPT", opts);
            if (opts.EnableMdm) AppendGpuService(sb, "motion_mdm", "audioverse/motion-mdm:latest", 8301, "MDM", opts);
            if (opts.EnableMoMask) AppendGpuService(sb, "motion_momask", "audioverse/motion-momask:latest", 8302, "MoMask", opts);
        }

        // ── Generative AI — Images ──
        if (opts.EnableComfyUi) AppendGpuService(sb, "comfyui", "ghcr.io/ai-dock/comfyui:latest", 8188, "ComfyUI (Stable Diffusion)", opts);
        if (opts.EnableStableDiffusion) AppendGpuService(sb, "sd_forge", "ghcr.io/ai-dock/stable-diffusion-webui-forge:latest", 7860, "SD WebUI Forge", opts);

        // ── Generative AI — 3D Models ──
        if (opts.EnableTripoSr) AppendGpuService(sb, "triposr", "stabilityai/triposr:latest", 8400, "TripoSR (image→3D)", opts);
        if (opts.EnableShapE) AppendGpuService(sb, "shape", "audioverse/shap-e:latest", 8401, "Shap-E (text→3D)", opts);
        if (opts.EnableInstantMesh) AppendGpuService(sb, "instantmesh", "audioverse/instantmesh:latest", 8402, "InstantMesh (image→3D)", opts);

        // ── Generative AI — Audio / SFX ──
        if (opts.EnableBark) AppendGpuService(sb, "bark", "suno/bark:latest", 8500, "Bark (text→audio/SFX)", opts);
        if (opts.EnableAudioLdm2) AppendGpuService(sb, "audioldm2", "audioverse/audioldm2:latest", 8501, "AudioLDM 2 (text→SFX)", opts);
        if (opts.EnableStableAudioOpen) AppendGpuService(sb, "stable_audio", "stabilityai/stable-audio-open:latest", 8502, "Stable Audio Open", opts);

        // ── Generative AI — Voice / TTS ──
        if (opts.EnableFasterWhisper) AppendService(sb, "asr_fw", "fedirz/faster-whisper-server:latest-cpu", 8000, "Faster Whisper ASR");
        if (opts.EnablePiperTts) AppendService(sb, "tts_piper", "rhasspy/wyoming-piper:latest", 10200, "Piper TTS");
        if (opts.EnableCoquiTts) AppendGpuService(sb, "tts_coqui", "ghcr.io/coqui-ai/tts:latest", 5002, "Coqui XTTS v2", opts);
        if (opts.EnableGptSoVits) AppendGpuService(sb, "gpt_sovits", "breakstring/gpt-sovits:latest", 9880, "GPT-SoVITS (singing voice cloning)", opts);
        if (opts.EnableFishSpeech) AppendGpuService(sb, "fish_speech", "fishaudio/fish-speech:latest", 8080, "Fish Speech", opts);
        if (opts.EnableOpenVoice) AppendService(sb, "openvoice", "myshell-ai/openvoice:latest", 8600, "OpenVoice v2");

        // ── Certbot ──
        if (opts.EnableCertbot)
        {
            sb.AppendLine("  certbot:");
            sb.AppendLine("    image: certbot/certbot");
            sb.AppendLine("    volumes:");
            sb.AppendLine("      - ./certs:/etc/letsencrypt");
            sb.AppendLine("      - ./nginx/www:/var/www/certbot:rw");
            sb.AppendLine("    entrypoint: [\"/bin/sh\", \"-c\", \"while true; do certbot renew --quiet; sleep 43200; done\"]");
            sb.AppendLine();
        }

        // ── Volumes ──
        sb.AppendLine("volumes:");
        sb.AppendLine("  postgres_data:");
        if (opts.EnableKaraoke) sb.AppendLine("  minio_data:");
        if (opts.EnableElasticsearch) sb.AppendLine("  elasticsearch_data:");
        if (opts.EnableKafka) sb.AppendLine("  kafka_data:");

        if (useDockerSecrets)
        {
            sb.AppendLine();
            sb.AppendLine("secrets:");
            sb.AppendLine("  postgres_password:");
            sb.AppendLine("    file: ./secrets/postgres_password.txt");
            sb.AppendLine("  minio_password:");
            sb.AppendLine("    file: ./secrets/minio_password.txt");
            sb.AppendLine("  redis_password:");
            sb.AppendLine("    file: ./secrets/redis_password.txt");
        }

        return sb.ToString();
    }

    private static void AppendPostgres(StringBuilder sb)
    {
        sb.AppendLine("  postgres:");
        sb.AppendLine("    image: postgres:15-alpine");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    environment:");
        sb.AppendLine("      POSTGRES_USER: ${POSTGRES_USER}");
        sb.AppendLine("      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}");
        sb.AppendLine("      POSTGRES_DB: ${POSTGRES_DB}");
        sb.AppendLine("    volumes:");
        sb.AppendLine("      - postgres_data:/var/lib/postgresql/data");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"5432:5432\"");
        sb.AppendLine();
    }

    private static void AppendRedis(StringBuilder sb)
    {
        sb.AppendLine("  redis:");
        sb.AppendLine("    image: redis:7-alpine");
        sb.AppendLine("    command: [\"redis-server\", \"--appendonly\", \"yes\"]");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"6379:6379\"");
        sb.AppendLine();
    }

    private static void AppendMinio(StringBuilder sb)
    {
        sb.AppendLine("  minio:");
        sb.AppendLine("    image: minio/minio:latest");
        sb.AppendLine("    command: server /data --console-address :9001");
        sb.AppendLine("    environment:");
        sb.AppendLine("      MINIO_ROOT_USER: ${MINIO_ROOT_USER}");
        sb.AppendLine("      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}");
        sb.AppendLine("    volumes:");
        sb.AppendLine("      - minio_data:/data");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"9000:9000\"");
        sb.AppendLine("      - \"9001:9001\"");
        sb.AppendLine();
    }

    private static void AppendMailHog(StringBuilder sb)
    {
        sb.AppendLine("  mailhog:");
        sb.AppendLine("    image: mailhog/mailhog:latest");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"1025:1025\"");
        sb.AppendLine("      - \"8025:8025\"");
        sb.AppendLine();
    }

    private static void AppendAdminer(StringBuilder sb)
    {
        sb.AppendLine("  adminer:");
        sb.AppendLine("    image: adminer:latest");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    environment:");
        sb.AppendLine("      ADMINER_DEFAULT_SERVER: postgres");
        sb.AppendLine("    depends_on:");
        sb.AppendLine("      - postgres");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"8080:8080\"");
        sb.AppendLine();
    }

    private static void AppendApi(StringBuilder sb, WizardOptions opts)
    {
        sb.AppendLine("  api:");
        sb.AppendLine("    image: audioverse/api:latest");
        sb.AppendLine("    build:");
        sb.AppendLine("      context: .");
        sb.AppendLine("      dockerfile: AudioVerse.API/Dockerfile");
        sb.AppendLine("    environment:");
        sb.AppendLine("      ASPNETCORE_ENVIRONMENT: ${ASPNETCORE_ENVIRONMENT}");
        sb.AppendLine("      Postgres__ConnectionString: \"Host=postgres;Port=5432;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}\"");
        sb.AppendLine("      REDIS_CONNECTION: \"redis:6379\"");
        if (opts.EnableKaraoke)
        {
            sb.AppendLine("      Minio__ServiceUrl: \"http://minio:9000\"");
            sb.AppendLine("      Minio__AccessKey: ${MINIO_ROOT_USER}");
            sb.AppendLine("      Minio__SecretKey: ${MINIO_ROOT_PASSWORD}");
            sb.AppendLine("      MINIO_ROOT_USER: ${MINIO_ROOT_USER}");
            sb.AppendLine("      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}");
        }
        sb.AppendLine("    depends_on:");
        sb.AppendLine("      - postgres");
        sb.AppendLine("      - redis");
        if (opts.EnableKaraoke) sb.AppendLine("      - minio");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"5000:5000\"");
        sb.AppendLine();
    }

    private static void AppendNginx(StringBuilder sb)
    {
        sb.AppendLine("  nginx:");
        sb.AppendLine("    image: nginx:stable-alpine");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"80:80\"");
        sb.AppendLine("      - \"443:443\"");
        sb.AppendLine("    volumes:");
        sb.AppendLine("      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro");
        sb.AppendLine("      - ./nginx/www:/var/www/certbot:ro");
        sb.AppendLine("      - ./certs:/etc/nginx/certs:ro");
        sb.AppendLine("    depends_on:");
        sb.AppendLine("      - api");
        sb.AppendLine("      - identity");
        sb.AppendLine("      - react");
        sb.AppendLine();
    }

    private static void AppendIdentity(StringBuilder sb)
    {
        sb.AppendLine("  identity:");
        sb.AppendLine("    image: audioverse/identity:latest");
        sb.AppendLine("    build:");
        sb.AppendLine("      context: .");
        sb.AppendLine("      dockerfile: AudioVerse.IdentityServer/Dockerfile");
        sb.AppendLine("    environment:");
        sb.AppendLine("      ASPNETCORE_ENVIRONMENT: ${ASPNETCORE_ENVIRONMENT}");
        sb.AppendLine("      ConnectionStrings__PostgresConnection: \"Host=postgres;Port=5432;Database=${POSTGRES_DB};Username=${POSTGRES_USER};Password=${POSTGRES_PASSWORD}\"");
        sb.AppendLine("      JwtSettings__Secret: ${JWT_SECRET}");
        sb.AppendLine("    depends_on:");
        sb.AppendLine("      - postgres");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"5002:5002\"");
        sb.AppendLine();
    }

    private static void AppendReact(StringBuilder sb)
    {
        sb.AppendLine("  react:");
        sb.AppendLine("    image: audioverse/react:latest");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"3080:80\"");
        sb.AppendLine();
    }

    private static void AppendElasticsearch(StringBuilder sb)
    {
        sb.AppendLine("  elasticsearch:");
        sb.AppendLine("    image: docker.elastic.co/elasticsearch/elasticsearch:8.15.0");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    environment:");
        sb.AppendLine("      - discovery.type=single-node");
        sb.AppendLine("      - ES_JAVA_OPTS=-Xms512m -Xmx512m");
        sb.AppendLine("      - xpack.security.enabled=false");
        sb.AppendLine("    volumes:");
        sb.AppendLine("      - elasticsearch_data:/usr/share/elasticsearch/data");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"9200:9200\"");
        sb.AppendLine();
    }

    private static void AppendKafka(StringBuilder sb)
    {
        sb.AppendLine("  zookeeper:");
        sb.AppendLine("    image: confluentinc/cp-zookeeper:latest");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    environment:");
        sb.AppendLine("      ZOOKEEPER_CLIENT_PORT: 2181");
        sb.AppendLine();
        sb.AppendLine("  kafka:");
        sb.AppendLine("    image: confluentinc/cp-kafka:latest");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    environment:");
        sb.AppendLine("      KAFKA_BROKER_ID: 1");
        sb.AppendLine("      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181");
        sb.AppendLine("      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092");
        sb.AppendLine("      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1");
        sb.AppendLine("    depends_on:");
        sb.AppendLine("      - zookeeper");
        sb.AppendLine("    volumes:");
        sb.AppendLine("      - kafka_data:/var/lib/kafka/data");
        sb.AppendLine("    ports:");
        sb.AppendLine("      - \"9092:9092\"");
        sb.AppendLine();
    }

    private static void AppendService(StringBuilder sb, string name, string image, int port, string comment)
    {
        sb.AppendLine($"  {name}: # {comment}");
        sb.AppendLine($"    image: {image}");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine($"      - \"{port}:{port}\"");
        sb.AppendLine();
    }

    private static void AppendGpuService(StringBuilder sb, string name, string image, int port, string comment, WizardOptions opts)
    {
        if (opts.GpuMode != RemoteGpuMode.None) return;
        sb.AppendLine($"  {name}: # {comment}");
        sb.AppendLine($"    image: {image}");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine($"      - \"{port}:{port}\"");
        sb.AppendLine("    deploy:");
        sb.AppendLine("      resources:");
        sb.AppendLine("        reservations:");
        sb.AppendLine("          devices:");
        sb.AppendLine("            - driver: nvidia");
        sb.AppendLine("              count: 1");
        sb.AppendLine("              capabilities: [gpu]");
        sb.AppendLine();
    }

    private static void AppendUtilsService(StringBuilder sb, string name, int port, string comment, string? buildContext = null)
    {
        var context = buildContext ?? $"utils/ai/{name}";
        sb.AppendLine($"  {name}: # {comment}");
        sb.AppendLine("    build:");
        sb.AppendLine($"      context: ./{context}");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine($"      - \"{port}:{port}\"");
        sb.AppendLine();
    }

    private static void AppendServiceWithPorts(StringBuilder sb, string name, int hostPort, int containerPort, string comment, string buildContext)
    {
        sb.AppendLine($"  {name}: # {comment}");
        sb.AppendLine("    build:");
        sb.AppendLine($"      context: {buildContext}");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine($"      - \"{hostPort}:{containerPort}\"");
        sb.AppendLine();
    }

    private static void AppendUtilsGpuService(StringBuilder sb, string name, int port, string comment, WizardOptions opts, string? dockerfile = null)
    {
        if (opts.GpuMode != RemoteGpuMode.None) return;
        sb.AppendLine($"  {name}: # {comment}");
        sb.AppendLine("    build:");
        sb.AppendLine($"      context: ./utils/ai/{name}");
        if (dockerfile is not null)
            sb.AppendLine($"      dockerfile: {dockerfile}");
        sb.AppendLine("    restart: unless-stopped");
        sb.AppendLine("    ports:");
        sb.AppendLine($"      - \"{port}:{port}\"");
        sb.AppendLine("    deploy:");
        sb.AppendLine("      resources:");
        sb.AppendLine("        reservations:");
        sb.AppendLine("          devices:");
        sb.AppendLine("            - driver: nvidia");
        sb.AppendLine("              count: 1");
        sb.AppendLine("              capabilities: [gpu]");
        sb.AppendLine();
    }
}
