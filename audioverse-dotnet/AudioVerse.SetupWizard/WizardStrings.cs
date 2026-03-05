// UTF-8 (BOM) — all strings stored as Unicode literals for safe compilation on any OS/locale.
namespace AudioVerse.SetupWizard;

/// <summary>
/// All user-facing strings for the setup wizard, organised by language.
/// Strings are compiled-in to avoid external resource file issues.
/// Every key has a translation for all 7 supported languages.
/// </summary>
public sealed class WizardStrings
{
    // ── Singleton per language ──
    private static readonly Dictionary<WizardLanguage, WizardStrings> _cache = new();

    public static WizardStrings Get(WizardLanguage lang)
    {
        if (_cache.TryGetValue(lang, out var cached)) return cached;
        var s = Build(lang);
        _cache[lang] = s;
        return s;
    }

    // ── Banner / global ──
    public string BannerTitle { get; init; } = "";
    public string BannerSubtitle { get; init; } = "";
    public string ProceedPrompt { get; init; } = "";
    public string Aborted { get; init; } = "";
    public string AllFilesGenerated { get; init; } = "";

    // ── Language selection (always in English + native name) ──
    public static readonly string[] LanguageLabels =
    [
        "English",
        "Polski (Polish)",
        "Espa\u00f1ol (Spanish)",
        "Fran\u00e7ais (French)",
        "Deutsch (German)",
        "\u4e2d\u6587 (Chinese)",
        "\u65e5\u672c\u8a9e (Japanese)"
    ];

    // ── Step 1 ──
    public string Step1Title { get; init; } = "";
    public string Step1Desc { get; init; } = "";
    public string DomainPrompt { get; init; } = "";
    public string EnvPrompt { get; init; } = "";
    public string[] EnvOptions { get; init; } = [];
    public string DeploymentModePrompt { get; init; } = "";
    public string[] DeploymentModeOptions { get; init; } = [];
    public string DeploymentModeDebugNote { get; init; } = "";

    // ── Step 2 ──
    public string Step2Title { get; init; } = "";
    public string Step2Desc { get; init; } = "";
    public string KaraokePrompt { get; init; } = "";

    // ── Step 3 ──
    public string Step3Title { get; init; } = "";
    public string Step3Desc { get; init; } = "";
    public string ElasticsearchPrompt { get; init; } = "";
    public string KafkaPrompt { get; init; } = "";

    // ── Step 4 ──
    public string Step4Title { get; init; } = "";
    public string Step4Desc { get; init; } = "";
    public string ConfigureAudioAiPrompt { get; init; } = "";
    public string ConfigureVideoAiPrompt { get; init; } = "";
    public string LibrosaPrompt { get; init; } = "";
    public string ConfigureMotionAiPrompt { get; init; } = "";
    public string MotionAiWarn { get; init; } = "";

    // ── Step 4b ──
    public string Step4bTitle { get; init; } = "";
    public string Step4bDesc { get; init; } = "";
    public string ConfigureImageGenPrompt { get; init; } = "";
    public string Configure3dGenPrompt { get; init; } = "";
    public string ConfigureSfxGenPrompt { get; init; } = "";
    public string ConfigureVoicePrompt { get; init; } = "";

    // ── Step 5 ──
    public string Step5Title { get; init; } = "";
    public string Step5Desc { get; init; } = "";
    public string RemoteGpuPrompt { get; init; } = "";
    public string GpuConnectionPrompt { get; init; } = "";
    public string[] GpuConnectionOptions { get; init; } = [];
    public string GpuHostPrompt { get; init; } = "";

    // ── Step 6 ──
    public string Step6Title { get; init; } = "";
    public string Step6Desc { get; init; } = "";
    public string AutoPasswordsPrompt { get; init; } = "";
    public string DockerSecretsPrompt { get; init; } = "";
    public string SslPrompt { get; init; } = "";
    public string[] SslOptions { get; init; } = [];
    public string CertEmailPrompt { get; init; } = "";
    public string CertFullchainPrompt { get; init; } = "";
    public string CertKeyPrompt { get; init; } = "";

    // ── Resource estimate ──
    public string ResourceBanner { get; init; } = "";
    public string EstRam { get; init; } = "";
    public string EstDisk { get; init; } = "";
    public string EstCpu { get; init; } = "";
    public string EstGpuVram { get; init; } = "";
    public string EstGpuLocation { get; init; } = "";
    public string EstGpuNotRequired { get; init; } = "";
    public string WarnHeavy { get; init; } = "";
    public string WarnMedium { get; init; } = "";
    public string InfoLight { get; init; } = "";
    public string WarnNoGpu { get; init; } = "";
    public string NotSelected { get; init; } = "";

    // ═══════════════════════════════════════════════
    //  Factory
    // ═══════════════════════════════════════════════
    private static WizardStrings Build(WizardLanguage lang) => lang switch
    {
        WizardLanguage.Polish => BuildPl(),
        WizardLanguage.Spanish => BuildEs(),
        WizardLanguage.French => BuildFr(),
        WizardLanguage.German => BuildDe(),
        WizardLanguage.Chinese => BuildZh(),
        WizardLanguage.Japanese => BuildJa(),
        _ => BuildEn()
    };

    // ═══════════════════════════════════════════════
    //  ENGLISH (default)
    // ═══════════════════════════════════════════════
    private static WizardStrings BuildEn() => new()
    {
        BannerTitle = "AudioVerse Setup Wizard",
        BannerSubtitle = "This wizard will configure your AudioVerse deployment.\n  Essential services (PostgreSQL, Redis) are always included.",
        ProceedPrompt = "Proceed with file generation?",
        Aborted = "Aborted.",
        AllFilesGenerated = "All files generated.",

        Step1Title = "STEP 1 \u2014 Basic Configuration",
        Step1Desc = "Set your domain and environment. The domain is used for SSL certificates\n  and Nginx routing. The environment controls logging level, optimizations\n  and whether hot-reload is enabled. Choose 'Debug' deployment to run the\n  API from Visual Studio instead of Docker.",
        DomainPrompt = "Domain name",
        EnvPrompt = "Environment:",
        EnvOptions = [
            "Development (default, debug logging)",
            "Staging (remote GPU testing)",
            "Production (optimized, SSL required)"
        ],
        DeploymentModePrompt = "Deployment mode:",
        DeploymentModeOptions = [
            "Full (all services in Docker, including AudioVerse API)",
            "Debug (API is NOT containerized \u2014 run it from Visual Studio / IDE)"
        ],
        DeploymentModeDebugNote = "Debug mode: docker-compose will start only infrastructure + AI services.\n  You run AudioVerse.API from Visual Studio with F5. Connection strings in\n  appsettings.Development.json point to localhost ports exposed by Docker.",

        Step2Title = "STEP 2 \u2014 Karaoke System",
        Step2Desc = "Karaoke is the core feature of AudioVerse. Enabling it adds MinIO (S3-compatible\n  object storage) for audio files, cover images and user recordings.\n  Impact: +128 MB RAM, +1 GB disk. Required for any music-related functionality.",
        KaraokePrompt = "Enable karaoke system?",

        Step3Title = "STEP 3 \u2014 Optional Infrastructure",
        Step3Desc = "These services add extra capabilities but consume significant resources.\n  Skip them unless you have a specific need \u2014 they can be added later.\n  Elasticsearch: enables full-text search across songs, lyrics, users.\n  Kafka: enables event streaming for real-time sync between services.",
        ElasticsearchPrompt = "Enable Elasticsearch? (full-text search, adds ~1 GB RAM)",
        KafkaPrompt = "Enable Kafka? (event streaming, adds ~768 MB RAM \u2014 rarely needed)",

        Step4Title = "STEP 4 \u2014 AI Services (utils/ai/)",
        Step4Desc = "AI services are Python sidecar containers from the utils/ai/ directory.\n  Each runs as an independent microservice with its own FastAPI endpoint.\n  They are called by AudioVerse.API via HTTP when users trigger AI features.\n  Each service adds RAM/CPU/GPU overhead \u2014 only enable what you need.\n  You can always enable them later by re-running the wizard.",
        ConfigureAudioAiPrompt = "Configure AI Audio services?",
        ConfigureVideoAiPrompt = "Configure AI Video services? (pose detection & tracking)",
        LibrosaPrompt = "Enable librosa service? (audio feature extraction \u2014 lightweight, ~256 MB)",
        ConfigureMotionAiPrompt = "Configure AI Motion services? (text-to-motion, all require GPU)",
        MotionAiWarn = "Each motion engine needs ~4 GB RAM + 4 GB GPU VRAM.",

        Step4bTitle = "STEP 4b \u2014 Generative AI (game assets, graphics, 3D, SFX, voice)",
        Step4bDesc = "Generative AI models create content: images, 3D models, sound effects, voices.\n  Most require a GPU with 4+ GB VRAM. All are free, open-source, self-hosted.\n  They are heavy \u2014 each model downloads 2\u201310 GB of weights on first run.",
        ConfigureImageGenPrompt = "Configure image generation?",
        Configure3dGenPrompt = "Configure 3D model generation? (image/text to 3D mesh)",
        ConfigureSfxGenPrompt = "Configure sound effect / audio generation?",
        ConfigureVoicePrompt = "Configure voice / TTS services?",

        Step5Title = "STEP 5 \u2014 Remote GPU",
        Step5Desc = "GPU services can run on a separate machine (e.g. a gaming PC with an\n  NVIDIA GPU) connected via Tailscale VPN or Cloudflare Tunnel.\n  This lets you run the main server on a cheap VPS without a GPU.",
        RemoteGpuPrompt = "Run GPU services on a remote machine? (recommended if server has no GPU)",
        GpuConnectionPrompt = "Connection method:",
        GpuConnectionOptions = [
            "Cloudflare Tunnel (no static IP needed, free, HTTPS)",
            "Tailscale VPN (mesh, instant setup, 2 commands)"
        ],
        GpuHostPrompt = "GPU machine hostname or Tailscale IP",

        Step6Title = "STEP 6 \u2014 Security",
        Step6Desc = "Configure passwords, secrets storage and SSL/TLS certificates.\n  Auto-generated passwords use cryptographically secure random bytes.\n  Docker secrets store passwords in files instead of environment variables\n  \u2014 more secure but requires Docker Swarm or Compose v2.20+.",
        AutoPasswordsPrompt = "Generate secure passwords automatically?",
        DockerSecretsPrompt = "Use Docker secrets (file-based, more secure)?",
        SslPrompt = "SSL/TLS mode:",
        SslOptions = [
            "Self-signed certificate (development)",
            "Let's Encrypt via Certbot (production)",
            "Bring your own certificate files",
            "None (HTTP only \u2014 not recommended)"
        ],
        CertEmailPrompt = "Email for Let's Encrypt",
        CertFullchainPrompt = "Path to fullchain.pem",
        CertKeyPrompt = "Path to privkey.pem",

        ResourceBanner = "RESOURCE ESTIMATE",
        EstRam = "Estimated total RAM",
        EstDisk = "Estimated disk space",
        EstCpu = "Recommended CPU cores",
        EstGpuVram = "GPU VRAM (min)",
        EstGpuLocation = "GPU location",
        EstGpuNotRequired = "Not required",
        NotSelected = "not selected",
        WarnHeavy = "This configuration needs 16+ GB RAM \u2014 consider a dedicated server or splitting GPU services.",
        WarnMedium = "This configuration needs 8+ GB RAM. Ensure your machine has enough free memory.",
        InfoLight = "Lightweight configuration \u2014 will run comfortably on most machines.",
        WarnNoGpu = "GPU services selected but no remote GPU configured. Ensure this machine has an NVIDIA GPU."
    };

    // ═══════════════════════════════════════════════
    //  POLISH
    // ═══════════════════════════════════════════════
    private static WizardStrings BuildPl() => new()
    {
        BannerTitle = "Kreator konfiguracji AudioVerse",
        BannerSubtitle = "Kreator skonfiguruje Twoje wdro\u017cenie AudioVerse.\n  Us\u0142ugi podstawowe (PostgreSQL, Redis) s\u0105 zawsze w\u0142\u0105czone.",
        ProceedPrompt = "Kontynuowa\u0107 generowanie plik\u00f3w?",
        Aborted = "Przerwano.",
        AllFilesGenerated = "Wszystkie pliki wygenerowane.",

        Step1Title = "KROK 1 \u2014 Podstawowa konfiguracja",
        Step1Desc = "Ustaw domen\u0119 i \u015brodowisko. Domena jest u\u017cywana do certyfikat\u00f3w SSL\n  i routingu Nginx. \u015arodowisko kontroluje poziom logowania i optymalizacje.\n  Tryb 'Debug' uruchamia API z Visual Studio zamiast z Dockera.",
        DomainPrompt = "Nazwa domeny",
        EnvPrompt = "\u015arodowisko:",
        EnvOptions = [
            "Development (domy\u015blne, debug logging)",
            "Staging (testy z GPU)",
            "Production (zoptymalizowane, SSL wymagany)"
        ],
        DeploymentModePrompt = "Tryb wdro\u017cenia:",
        DeploymentModeOptions = [
            "Pe\u0142ny (wszystkie us\u0142ugi w Dockerze, w\u0142\u0105cznie z API)",
            "Debug (API NIE jest w kontenerze \u2014 uruchom z Visual Studio / IDE)"
        ],
        DeploymentModeDebugNote = "Tryb Debug: docker-compose uruchomi tylko infrastruktur\u0119 + us\u0142ugi AI.\n  API uruchamiasz z Visual Studio klawiszem F5. Connection stringi\n  w appsettings.Development.json wskazuj\u0105 na porty localhost Dockera.",

        Step2Title = "KROK 2 \u2014 System karaoke",
        Step2Desc = "Karaoke to g\u0142\u00f3wna funkcja AudioVerse. W\u0142\u0105czenie dodaje MinIO (storage S3)\n  do plik\u00f3w audio, ok\u0142adek i nagra\u0144 u\u017cytkownik\u00f3w.\n  Wp\u0142yw: +128 MB RAM, +1 GB dysku. Wymagane do ka\u017cdej funkcji muzycznej.",
        KaraokePrompt = "W\u0142\u0105czy\u0107 system karaoke?",

        Step3Title = "KROK 3 \u2014 Opcjonalna infrastruktura",
        Step3Desc = "Te us\u0142ugi dodaj\u0105 funkcje, ale zu\u017cywaj\u0105 du\u017co zasob\u00f3w. Pomi\u0144, je\u015bli nie potrzebujesz.\n  Elasticsearch: wyszukiwanie pe\u0142notekstowe piosenek, tekst\u00f3w, u\u017cytkownik\u00f3w.\n  Kafka: strumieniowanie zdarze\u0144 w czasie rzeczywistym.",
        ElasticsearchPrompt = "W\u0142\u0105czy\u0107 Elasticsearch? (wyszukiwanie, +1 GB RAM)",
        KafkaPrompt = "W\u0142\u0105czy\u0107 Kafka? (eventy, +768 MB RAM \u2014 rzadko potrzebne)",

        Step4Title = "KROK 4 \u2014 Us\u0142ugi AI (utils/ai/)",
        Step4Desc = "Us\u0142ugi AI to kontenery Pythona z katalogu utils/ai/.\n  Ka\u017cda dzia\u0142a jako niezale\u017cny mikroserwis z w\u0142asnym endpointem FastAPI.\n  AudioVerse.API wywo\u0142uje je przez HTTP. Ka\u017cda dodaje obci\u0105\u017cenie RAM/CPU/GPU.\n  Mo\u017cesz je w\u0142\u0105czy\u0107 p\u00f3\u017aniej, uruchamiaj\u0105c kreator ponownie.",
        ConfigureAudioAiPrompt = "Skonfigurowa\u0107 us\u0142ugi AI Audio?",
        ConfigureVideoAiPrompt = "Skonfigurowa\u0107 us\u0142ugi AI Video? (wykrywanie pozy)",
        LibrosaPrompt = "W\u0142\u0105czy\u0107 librosa? (ekstrakcja cech audio \u2014 lekki, ~256 MB)",
        ConfigureMotionAiPrompt = "Skonfigurowa\u0107 AI Motion? (tekst\u2192ruch, wymaga GPU)",
        MotionAiWarn = "Ka\u017cdy silnik motion potrzebuje ~4 GB RAM + 4 GB GPU VRAM.",

        Step4bTitle = "KROK 4b \u2014 Generatywne AI (grafika, 3D, SFX, g\u0142os)",
        Step4bDesc = "Modele generatywne tworz\u0105 tre\u015bci: obrazy, modele 3D, efekty d\u017awi\u0119kowe, g\u0142osy.\n  Wi\u0119kszo\u015b\u0107 wymaga GPU z 4+ GB VRAM. Wszystkie s\u0105 darmowe i open-source.\n  S\u0105 ci\u0119\u017ckie \u2014 ka\u017cdy model pobiera 2\u201310 GB wag przy pierwszym uruchomieniu.",
        ConfigureImageGenPrompt = "Skonfigurowa\u0107 generowanie obraz\u00f3w?",
        Configure3dGenPrompt = "Skonfigurowa\u0107 generowanie modeli 3D?",
        ConfigureSfxGenPrompt = "Skonfigurowa\u0107 generowanie SFX / audio?",
        ConfigureVoicePrompt = "Skonfigurowa\u0107 us\u0142ugi g\u0142osowe / TTS?",

        Step5Title = "KROK 5 \u2014 Zdalne GPU",
        Step5Desc = "Us\u0142ugi GPU mog\u0105 dzia\u0142a\u0107 na osobnej maszynie (np. PC z kart\u0105 NVIDIA)\n  po\u0142\u0105czonej przez Tailscale VPN lub Cloudflare Tunnel.\n  To pozwala uruchomi\u0107 serwer na tanim VPS bez GPU.",
        RemoteGpuPrompt = "Uruchomi\u0107 us\u0142ugi GPU na zdalnej maszynie?",
        GpuConnectionPrompt = "Metoda po\u0142\u0105czenia:",
        GpuConnectionOptions = [
            "Cloudflare Tunnel (bez sta\u0142ego IP, darmowy, HTTPS)",
            "Tailscale VPN (mesh, b\u0142yskawiczna konfiguracja)"
        ],
        GpuHostPrompt = "Hostname maszyny GPU lub IP Tailscale",

        Step6Title = "KROK 6 \u2014 Bezpiecze\u0144stwo",
        Step6Desc = "Skonfiguruj has\u0142a, spos\u00f3b przechowywania sekret\u00f3w i certyfikaty SSL/TLS.\n  Automatyczne has\u0142a u\u017cywaj\u0105 kryptograficznie bezpiecznych losowych bajt\u00f3w.\n  Docker secrets przechowuj\u0105 has\u0142a w plikach zamiast zmiennych \u015brodowiskowych.",
        AutoPasswordsPrompt = "Generowa\u0107 bezpieczne has\u0142a automatycznie?",
        DockerSecretsPrompt = "U\u017cy\u0107 Docker secrets (plikowe, bezpieczniejsze)?",
        SslPrompt = "Tryb SSL/TLS:",
        SslOptions = [
            "Certyfikat self-signed (development)",
            "Let's Encrypt przez Certbot (produkcja)",
            "W\u0142asne pliki certyfikatu",
            "Brak (tylko HTTP \u2014 niezalecane)"
        ],
        CertEmailPrompt = "Email dla Let's Encrypt",
        CertFullchainPrompt = "\u015acie\u017cka do fullchain.pem",
        CertKeyPrompt = "\u015acie\u017cka do privkey.pem",

        ResourceBanner = "SZACOWANE ZASOBY",
        EstRam = "Szacowany RAM ca\u0142kowity",
        EstDisk = "Szacowana przestrze\u0144 dyskowa",
        EstCpu = "Zalecane rdzenie CPU",
        EstGpuVram = "GPU VRAM (min)",
        EstGpuLocation = "Lokalizacja GPU",
        EstGpuNotRequired = "Nie wymagane",
        NotSelected = "nie wybrano",
        WarnHeavy = "Ta konfiguracja wymaga 16+ GB RAM \u2014 rozwa\u017c dedykowany serwer.",
        WarnMedium = "Ta konfiguracja wymaga 8+ GB RAM. Upewnij si\u0119, \u017ce maszyna ma wystarczaj\u0105co pami\u0119ci.",
        InfoLight = "Lekka konfiguracja \u2014 b\u0119dzie dzia\u0142a\u0107 komfortowo na wi\u0119kszo\u015bci maszyn.",
        WarnNoGpu = "Wybrano us\u0142ugi GPU, ale nie skonfigurowano zdalnego GPU. Upewnij si\u0119, \u017ce maszyna ma kart\u0119 NVIDIA."
    };

    // ═══════════════════════════════════════════════
    //  SPANISH
    // ═══════════════════════════════════════════════
    private static WizardStrings BuildEs() => new()
    {
        BannerTitle = "Asistente de configuraci\u00f3n de AudioVerse",
        BannerSubtitle = "Este asistente configurar\u00e1 tu despliegue de AudioVerse.\n  Los servicios esenciales (PostgreSQL, Redis) siempre est\u00e1n incluidos.",
        ProceedPrompt = "\u00bfContinuar con la generaci\u00f3n de archivos?",
        Aborted = "Cancelado.",
        AllFilesGenerated = "Todos los archivos generados.",

        Step1Title = "PASO 1 \u2014 Configuraci\u00f3n b\u00e1sica",
        Step1Desc = "Configura tu dominio y entorno. El dominio se usa para certificados SSL\n  y enrutamiento Nginx. El modo 'Debug' ejecuta la API desde Visual Studio.",
        DomainPrompt = "Nombre de dominio",
        EnvPrompt = "Entorno:",
        EnvOptions = [
            "Development (por defecto, logging de depuraci\u00f3n)",
            "Staging (pruebas con GPU remota)",
            "Production (optimizado, SSL requerido)"
        ],
        DeploymentModePrompt = "Modo de despliegue:",
        DeploymentModeOptions = [
            "Completo (todos los servicios en Docker, incluyendo la API)",
            "Debug (la API NO est\u00e1 en contenedor \u2014 ejecutar desde Visual Studio / IDE)"
        ],
        DeploymentModeDebugNote = "Modo Debug: docker-compose iniciar\u00e1 solo infraestructura + servicios AI.\n  Ejecuta AudioVerse.API desde Visual Studio con F5.",

        Step2Title = "PASO 2 \u2014 Sistema de karaoke",
        Step2Desc = "El karaoke es la funci\u00f3n principal. Habilita MinIO para archivos de audio.\n  Impacto: +128 MB RAM, +1 GB disco.",
        KaraokePrompt = "\u00bfHabilitar sistema de karaoke?",

        Step3Title = "PASO 3 \u2014 Infraestructura opcional",
        Step3Desc = "Servicios que agregan capacidades pero consumen recursos significativos.\n  Elasticsearch: b\u00fasqueda de texto completo. Kafka: streaming de eventos.",
        ElasticsearchPrompt = "\u00bfHabilitar Elasticsearch? (+1 GB RAM)",
        KafkaPrompt = "\u00bfHabilitar Kafka? (+768 MB RAM)",

        Step4Title = "PASO 4 \u2014 Servicios AI (utils/ai/)",
        Step4Desc = "Microservicios Python con endpoints FastAPI.\n  AudioVerse.API los llama por HTTP. Cada uno a\u00f1ade carga de RAM/CPU/GPU.",
        ConfigureAudioAiPrompt = "\u00bfConfigurar servicios de AI Audio?",
        ConfigureVideoAiPrompt = "\u00bfConfigurar servicios de AI Video?",
        LibrosaPrompt = "\u00bfHabilitar librosa? (~256 MB)",
        ConfigureMotionAiPrompt = "\u00bfConfigurar AI Motion? (requiere GPU)",
        MotionAiWarn = "Cada motor necesita ~4 GB RAM + 4 GB GPU VRAM.",

        Step4bTitle = "PASO 4b \u2014 IA Generativa",
        Step4bDesc = "Modelos que crean contenido: im\u00e1genes, modelos 3D, efectos de sonido, voces.\n  La mayor\u00eda requiere GPU con 4+ GB VRAM.",
        ConfigureImageGenPrompt = "\u00bfConfigurar generaci\u00f3n de im\u00e1genes?",
        Configure3dGenPrompt = "\u00bfConfigurar generaci\u00f3n de modelos 3D?",
        ConfigureSfxGenPrompt = "\u00bfConfigurar generaci\u00f3n de SFX/audio?",
        ConfigureVoicePrompt = "\u00bfConfigurar servicios de voz/TTS?",

        Step5Title = "PASO 5 \u2014 GPU remota",
        Step5Desc = "Los servicios GPU pueden ejecutarse en otra m\u00e1quina conectada por Tailscale o Cloudflare.",
        RemoteGpuPrompt = "\u00bfEjecutar servicios GPU en m\u00e1quina remota?",
        GpuConnectionPrompt = "M\u00e9todo de conexi\u00f3n:",
        GpuConnectionOptions = [
            "Cloudflare Tunnel (sin IP fija, gratis, HTTPS)",
            "Tailscale VPN (mesh, configuraci\u00f3n instant\u00e1nea)"
        ],
        GpuHostPrompt = "Hostname de la m\u00e1quina GPU",

        Step6Title = "PASO 6 \u2014 Seguridad",
        Step6Desc = "Configura contrase\u00f1as, almacenamiento de secretos y certificados SSL/TLS.",
        AutoPasswordsPrompt = "\u00bfGenerar contrase\u00f1as seguras autom\u00e1ticamente?",
        DockerSecretsPrompt = "\u00bfUsar Docker secrets?",
        SslPrompt = "Modo SSL/TLS:",
        SslOptions = [
            "Certificado autofirmado (desarrollo)",
            "Let's Encrypt (producci\u00f3n)",
            "Archivos de certificado propios",
            "Ninguno (solo HTTP)"
        ],
        CertEmailPrompt = "Email para Let's Encrypt",
        CertFullchainPrompt = "Ruta a fullchain.pem",
        CertKeyPrompt = "Ruta a privkey.pem",

        ResourceBanner = "ESTIMACI\u00d3N DE RECURSOS",
        EstRam = "RAM total estimada",
        EstDisk = "Espacio en disco estimado",
        EstCpu = "N\u00facleos CPU recomendados",
        EstGpuVram = "GPU VRAM (m\u00edn)",
        EstGpuLocation = "Ubicaci\u00f3n GPU",
        EstGpuNotRequired = "No requerida",
        NotSelected = "no seleccionado",
        WarnHeavy = "Esta configuraci\u00f3n necesita 16+ GB RAM.",
        WarnMedium = "Esta configuraci\u00f3n necesita 8+ GB RAM.",
        InfoLight = "Configuraci\u00f3n ligera \u2014 funcionar\u00e1 c\u00f3modamente.",
        WarnNoGpu = "Servicios GPU seleccionados pero sin GPU remota configurada."
    };

    // ═══════════════════════════════════════════════
    //  FRENCH
    // ═══════════════════════════════════════════════
    private static WizardStrings BuildFr() => new()
    {
        BannerTitle = "Assistant de configuration AudioVerse",
        BannerSubtitle = "Cet assistant configurera votre d\u00e9ploiement AudioVerse.\n  Les services essentiels (PostgreSQL, Redis) sont toujours inclus.",
        ProceedPrompt = "Continuer la g\u00e9n\u00e9ration des fichiers ?",
        Aborted = "Annul\u00e9.",
        AllFilesGenerated = "Tous les fichiers g\u00e9n\u00e9r\u00e9s.",

        Step1Title = "\u00c9TAPE 1 \u2014 Configuration de base",
        Step1Desc = "D\u00e9finissez votre domaine et environnement. Le mode 'Debug' ex\u00e9cute l'API\n  depuis Visual Studio au lieu de Docker.",
        DomainPrompt = "Nom de domaine",
        EnvPrompt = "Environnement :",
        EnvOptions = [
            "Development (par d\u00e9faut, logs de d\u00e9bogage)",
            "Staging (tests GPU distant)",
            "Production (optimis\u00e9, SSL requis)"
        ],
        DeploymentModePrompt = "Mode de d\u00e9ploiement :",
        DeploymentModeOptions = [
            "Complet (tous les services dans Docker, y compris l'API)",
            "Debug (l'API n'est PAS conteneuris\u00e9e \u2014 lancer depuis Visual Studio)"
        ],
        DeploymentModeDebugNote = "Mode Debug : docker-compose lancera uniquement l'infrastructure + services AI.",

        Step2Title = "\u00c9TAPE 2 \u2014 Syst\u00e8me karaok\u00e9",
        Step2Desc = "Le karaok\u00e9 est la fonction principale. Active MinIO pour le stockage audio.\n  Impact : +128 Mo RAM, +1 Go disque.",
        KaraokePrompt = "Activer le syst\u00e8me karaok\u00e9 ?",

        Step3Title = "\u00c9TAPE 3 \u2014 Infrastructure optionnelle",
        Step3Desc = "Services suppl\u00e9mentaires consommant des ressources significatives.",
        ElasticsearchPrompt = "Activer Elasticsearch ? (+1 Go RAM)",
        KafkaPrompt = "Activer Kafka ? (+768 Mo RAM)",

        Step4Title = "\u00c9TAPE 4 \u2014 Services AI (utils/ai/)",
        Step4Desc = "Microservices Python avec endpoints FastAPI, appel\u00e9s par l'API .NET via HTTP.",
        ConfigureAudioAiPrompt = "Configurer les services AI Audio ?",
        ConfigureVideoAiPrompt = "Configurer les services AI Vid\u00e9o ?",
        LibrosaPrompt = "Activer librosa ? (~256 Mo)",
        ConfigureMotionAiPrompt = "Configurer AI Motion ? (n\u00e9cessite GPU)",
        MotionAiWarn = "Chaque moteur n\u00e9cessite ~4 Go RAM + 4 Go GPU VRAM.",

        Step4bTitle = "\u00c9TAPE 4b \u2014 IA G\u00e9n\u00e9rative",
        Step4bDesc = "Mod\u00e8les cr\u00e9ant du contenu : images, mod\u00e8les 3D, effets sonores, voix.",
        ConfigureImageGenPrompt = "Configurer la g\u00e9n\u00e9ration d'images ?",
        Configure3dGenPrompt = "Configurer la g\u00e9n\u00e9ration 3D ?",
        ConfigureSfxGenPrompt = "Configurer la g\u00e9n\u00e9ration SFX/audio ?",
        ConfigureVoicePrompt = "Configurer les services voix/TTS ?",

        Step5Title = "\u00c9TAPE 5 \u2014 GPU distant",
        Step5Desc = "Les services GPU peuvent tourner sur une machine s\u00e9par\u00e9e via Tailscale ou Cloudflare.",
        RemoteGpuPrompt = "Ex\u00e9cuter les services GPU sur une machine distante ?",
        GpuConnectionPrompt = "M\u00e9thode de connexion :",
        GpuConnectionOptions = [
            "Cloudflare Tunnel (pas d'IP fixe, gratuit, HTTPS)",
            "Tailscale VPN (mesh, configuration instantan\u00e9e)"
        ],
        GpuHostPrompt = "Hostname de la machine GPU",

        Step6Title = "\u00c9TAPE 6 \u2014 S\u00e9curit\u00e9",
        Step6Desc = "Configurez mots de passe, stockage des secrets et certificats SSL/TLS.",
        AutoPasswordsPrompt = "G\u00e9n\u00e9rer des mots de passe s\u00e9curis\u00e9s automatiquement ?",
        DockerSecretsPrompt = "Utiliser Docker secrets ?",
        SslPrompt = "Mode SSL/TLS :",
        SslOptions = [
            "Certificat auto-sign\u00e9 (d\u00e9veloppement)",
            "Let's Encrypt via Certbot (production)",
            "Vos propres fichiers de certificat",
            "Aucun (HTTP uniquement)"
        ],
        CertEmailPrompt = "Email pour Let's Encrypt",
        CertFullchainPrompt = "Chemin vers fullchain.pem",
        CertKeyPrompt = "Chemin vers privkey.pem",

        ResourceBanner = "ESTIMATION DES RESSOURCES",
        EstRam = "RAM totale estim\u00e9e",
        EstDisk = "Espace disque estim\u00e9",
        EstCpu = "C\u0153urs CPU recommand\u00e9s",
        EstGpuVram = "GPU VRAM (min)",
        EstGpuLocation = "Emplacement GPU",
        EstGpuNotRequired = "Non requis",
        NotSelected = "non s\u00e9lectionn\u00e9",
        WarnHeavy = "Cette configuration n\u00e9cessite 16+ Go RAM.",
        WarnMedium = "Cette configuration n\u00e9cessite 8+ Go RAM.",
        InfoLight = "Configuration l\u00e9g\u00e8re \u2014 fonctionnera confortablement.",
        WarnNoGpu = "Services GPU s\u00e9lectionn\u00e9s mais pas de GPU distant configur\u00e9."
    };

    // ═══════════════════════════════════════════════
    //  GERMAN
    // ═══════════════════════════════════════════════
    private static WizardStrings BuildDe() => new()
    {
        BannerTitle = "AudioVerse Einrichtungsassistent",
        BannerSubtitle = "Dieser Assistent konfiguriert Ihre AudioVerse-Installation.\n  Grunddienste (PostgreSQL, Redis) sind immer enthalten.",
        ProceedPrompt = "Mit der Dateigenerierung fortfahren?",
        Aborted = "Abgebrochen.",
        AllFilesGenerated = "Alle Dateien generiert.",

        Step1Title = "SCHRITT 1 \u2014 Grundkonfiguration",
        Step1Desc = "Dom\u00e4ne und Umgebung festlegen. 'Debug'-Modus startet die API aus Visual Studio.",
        DomainPrompt = "Dom\u00e4nname",
        EnvPrompt = "Umgebung:",
        EnvOptions = [
            "Development (Standard, Debug-Logging)",
            "Staging (Remote-GPU-Tests)",
            "Production (optimiert, SSL erforderlich)"
        ],
        DeploymentModePrompt = "Bereitstellungsmodus:",
        DeploymentModeOptions = [
            "Vollst\u00e4ndig (alle Dienste in Docker, inkl. API)",
            "Debug (API ist NICHT containerisiert \u2014 aus Visual Studio starten)"
        ],
        DeploymentModeDebugNote = "Debug-Modus: docker-compose startet nur Infrastruktur + AI-Dienste.",

        Step2Title = "SCHRITT 2 \u2014 Karaoke-System",
        Step2Desc = "Karaoke ist die Kernfunktion. Aktiviert MinIO f\u00fcr Audio-Dateispeicherung.\n  Auswirkung: +128 MB RAM, +1 GB Festplatte.",
        KaraokePrompt = "Karaoke-System aktivieren?",

        Step3Title = "SCHRITT 3 \u2014 Optionale Infrastruktur",
        Step3Desc = "Zus\u00e4tzliche Dienste mit erheblichem Ressourcenbedarf.",
        ElasticsearchPrompt = "Elasticsearch aktivieren? (+1 GB RAM)",
        KafkaPrompt = "Kafka aktivieren? (+768 MB RAM)",

        Step4Title = "SCHRITT 4 \u2014 AI-Dienste (utils/ai/)",
        Step4Desc = "Python-Microservices mit FastAPI-Endpunkten, die per HTTP aufgerufen werden.",
        ConfigureAudioAiPrompt = "AI-Audio-Dienste konfigurieren?",
        ConfigureVideoAiPrompt = "AI-Video-Dienste konfigurieren?",
        LibrosaPrompt = "Librosa aktivieren? (~256 MB)",
        ConfigureMotionAiPrompt = "AI-Motion konfigurieren? (GPU erforderlich)",
        MotionAiWarn = "Jede Motion-Engine ben\u00f6tigt ~4 GB RAM + 4 GB GPU VRAM.",

        Step4bTitle = "SCHRITT 4b \u2014 Generative KI",
        Step4bDesc = "Modelle zur Inhaltserstellung: Bilder, 3D-Modelle, Soundeffekte, Stimmen.",
        ConfigureImageGenPrompt = "Bildgenerierung konfigurieren?",
        Configure3dGenPrompt = "3D-Modellgenerierung konfigurieren?",
        ConfigureSfxGenPrompt = "SFX/Audio-Generierung konfigurieren?",
        ConfigureVoicePrompt = "Sprach-/TTS-Dienste konfigurieren?",

        Step5Title = "SCHRITT 5 \u2014 Remote-GPU",
        Step5Desc = "GPU-Dienste k\u00f6nnen auf einem separaten Rechner laufen.",
        RemoteGpuPrompt = "GPU-Dienste auf Remote-Maschine ausf\u00fchren?",
        GpuConnectionPrompt = "Verbindungsmethode:",
        GpuConnectionOptions = [
            "Cloudflare Tunnel (keine feste IP, kostenlos, HTTPS)",
            "Tailscale VPN (Mesh, sofortige Einrichtung)"
        ],
        GpuHostPrompt = "GPU-Maschine Hostname",

        Step6Title = "SCHRITT 6 \u2014 Sicherheit",
        Step6Desc = "Passw\u00f6rter, Secrets-Speicherung und SSL/TLS-Zertifikate konfigurieren.",
        AutoPasswordsPrompt = "Sichere Passw\u00f6rter automatisch generieren?",
        DockerSecretsPrompt = "Docker Secrets verwenden?",
        SslPrompt = "SSL/TLS-Modus:",
        SslOptions = [
            "Selbstsigniertes Zertifikat (Entwicklung)",
            "Let's Encrypt \u00fcber Certbot (Produktion)",
            "Eigene Zertifikatdateien",
            "Keines (nur HTTP)"
        ],
        CertEmailPrompt = "E-Mail f\u00fcr Let's Encrypt",
        CertFullchainPrompt = "Pfad zu fullchain.pem",
        CertKeyPrompt = "Pfad zu privkey.pem",

        ResourceBanner = "RESSOURCENSCH\u00c4TZUNG",
        EstRam = "Gesch\u00e4tzter Gesamt-RAM",
        EstDisk = "Gesch\u00e4tzter Speicherplatz",
        EstCpu = "Empfohlene CPU-Kerne",
        EstGpuVram = "GPU VRAM (min)",
        EstGpuLocation = "GPU-Standort",
        EstGpuNotRequired = "Nicht erforderlich",
        NotSelected = "nicht ausgew\u00e4hlt",
        WarnHeavy = "Diese Konfiguration ben\u00f6tigt 16+ GB RAM.",
        WarnMedium = "Diese Konfiguration ben\u00f6tigt 8+ GB RAM.",
        InfoLight = "Leichte Konfiguration \u2014 l\u00e4uft komfortabel auf den meisten Maschinen.",
        WarnNoGpu = "GPU-Dienste ausgew\u00e4hlt aber kein Remote-GPU konfiguriert."
    };

    // ═══════════════════════════════════════════════
    //  CHINESE (Simplified)
    // ═══════════════════════════════════════════════
    private static WizardStrings BuildZh() => new()
    {
        BannerTitle = "AudioVerse \u5b89\u88c5\u5411\u5bfc",
        BannerSubtitle = "\u6b64\u5411\u5bfc\u5c06\u914d\u7f6e\u60a8\u7684 AudioVerse \u90e8\u7f72\u3002\n  \u57fa\u672c\u670d\u52a1\uff08PostgreSQL\u3001Redis\uff09\u59cb\u7ec8\u5305\u542b\u5728\u5185\u3002",
        ProceedPrompt = "\u7ee7\u7eed\u751f\u6210\u6587\u4ef6\uff1f",
        Aborted = "\u5df2\u53d6\u6d88\u3002",
        AllFilesGenerated = "\u6240\u6709\u6587\u4ef6\u5df2\u751f\u6210\u3002",

        Step1Title = "\u6b65\u9aa4 1 \u2014 \u57fa\u672c\u914d\u7f6e",
        Step1Desc = "\u8bbe\u7f6e\u57df\u540d\u548c\u73af\u5883\u3002'Debug' \u6a21\u5f0f\u4ece Visual Studio \u542f\u52a8 API\u3002",
        DomainPrompt = "\u57df\u540d",
        EnvPrompt = "\u73af\u5883\uff1a",
        EnvOptions = [
            "Development\uff08\u9ed8\u8ba4\uff0c\u8c03\u8bd5\u65e5\u5fd7\uff09",
            "Staging\uff08\u8fdc\u7a0b GPU \u6d4b\u8bd5\uff09",
            "Production\uff08\u4f18\u5316\uff0c\u9700\u8981 SSL\uff09"
        ],
        DeploymentModePrompt = "\u90e8\u7f72\u6a21\u5f0f\uff1a",
        DeploymentModeOptions = [
            "\u5b8c\u6574\uff08\u6240\u6709\u670d\u52a1\u5728 Docker \u4e2d\uff0c\u5305\u62ec API\uff09",
            "Debug\uff08API \u4e0d\u5728\u5bb9\u5668\u4e2d \u2014 \u4ece Visual Studio \u542f\u52a8\uff09"
        ],
        DeploymentModeDebugNote = "Debug \u6a21\u5f0f\uff1adocker-compose \u53ea\u542f\u52a8\u57fa\u7840\u8bbe\u65bd + AI \u670d\u52a1\u3002",

        Step2Title = "\u6b65\u9aa4 2 \u2014 \u5361\u62c9OK\u7cfb\u7edf",
        Step2Desc = "\u5361\u62c9OK\u662f\u6838\u5fc3\u529f\u80fd\u3002\u542f\u7528 MinIO \u5b58\u50a8\u97f3\u9891\u6587\u4ef6\u3002\n  \u5f71\u54cd\uff1a+128 MB RAM\uff0c+1 GB \u78c1\u76d8\u3002",
        KaraokePrompt = "\u542f\u7528\u5361\u62c9OK\u7cfb\u7edf\uff1f",

        Step3Title = "\u6b65\u9aa4 3 \u2014 \u53ef\u9009\u57fa\u7840\u8bbe\u65bd",
        Step3Desc = "\u8fd9\u4e9b\u670d\u52a1\u6d88\u8017\u5927\u91cf\u8d44\u6e90\uff0c\u4ec5\u5728\u9700\u8981\u65f6\u542f\u7528\u3002",
        ElasticsearchPrompt = "\u542f\u7528 Elasticsearch\uff1f\uff08+1 GB RAM\uff09",
        KafkaPrompt = "\u542f\u7528 Kafka\uff1f\uff08+768 MB RAM\uff09",

        Step4Title = "\u6b65\u9aa4 4 \u2014 AI \u670d\u52a1 (utils/ai/)",
        Step4Desc = "Python \u5fae\u670d\u52a1\uff0c\u901a\u8fc7 HTTP \u88ab .NET API \u8c03\u7528\u3002\u6bcf\u4e2a\u670d\u52a1\u589e\u52a0 RAM/CPU/GPU \u5f00\u9500\u3002",
        ConfigureAudioAiPrompt = "\u914d\u7f6e\u97f3\u9891 AI \u670d\u52a1\uff1f",
        ConfigureVideoAiPrompt = "\u914d\u7f6e\u89c6\u9891 AI \u670d\u52a1\uff1f",
        LibrosaPrompt = "\u542f\u7528 librosa\uff1f\uff08~256 MB\uff09",
        ConfigureMotionAiPrompt = "\u914d\u7f6e\u52a8\u4f5c AI\uff1f\uff08\u9700\u8981 GPU\uff09",
        MotionAiWarn = "\u6bcf\u4e2a\u5f15\u64ce\u9700\u8981 ~4 GB RAM + 4 GB GPU VRAM\u3002",

        Step4bTitle = "\u6b65\u9aa4 4b \u2014 \u751f\u6210\u5f0f AI",
        Step4bDesc = "\u751f\u6210\u5185\u5bb9\uff1a\u56fe\u50cf\u30013D \u6a21\u578b\u3001\u97f3\u6548\u3001\u8bed\u97f3\u3002\u5927\u591a\u6570\u9700\u8981 GPU\u3002",
        ConfigureImageGenPrompt = "\u914d\u7f6e\u56fe\u50cf\u751f\u6210\uff1f",
        Configure3dGenPrompt = "\u914d\u7f6e 3D \u6a21\u578b\u751f\u6210\uff1f",
        ConfigureSfxGenPrompt = "\u914d\u7f6e\u97f3\u6548\u751f\u6210\uff1f",
        ConfigureVoicePrompt = "\u914d\u7f6e\u8bed\u97f3/TTS \u670d\u52a1\uff1f",

        Step5Title = "\u6b65\u9aa4 5 \u2014 \u8fdc\u7a0b GPU",
        Step5Desc = "GPU \u670d\u52a1\u53ef\u4ee5\u5728\u5355\u72ec\u7684\u673a\u5668\u4e0a\u8fd0\u884c\u3002",
        RemoteGpuPrompt = "\u5728\u8fdc\u7a0b\u673a\u5668\u4e0a\u8fd0\u884c GPU \u670d\u52a1\uff1f",
        GpuConnectionPrompt = "\u8fde\u63a5\u65b9\u5f0f\uff1a",
        GpuConnectionOptions = [
            "Cloudflare Tunnel\uff08\u65e0\u9700\u56fa\u5b9a IP\uff09",
            "Tailscale VPN\uff08\u5373\u65f6\u8bbe\u7f6e\uff09"
        ],
        GpuHostPrompt = "GPU \u673a\u5668\u4e3b\u673a\u540d",

        Step6Title = "\u6b65\u9aa4 6 \u2014 \u5b89\u5168",
        Step6Desc = "\u914d\u7f6e\u5bc6\u7801\u3001\u79d8\u5bc6\u5b58\u50a8\u548c SSL/TLS \u8bc1\u4e66\u3002",
        AutoPasswordsPrompt = "\u81ea\u52a8\u751f\u6210\u5b89\u5168\u5bc6\u7801\uff1f",
        DockerSecretsPrompt = "\u4f7f\u7528 Docker secrets\uff1f",
        SslPrompt = "SSL/TLS \u6a21\u5f0f\uff1a",
        SslOptions = [
            "\u81ea\u7b7e\u540d\u8bc1\u4e66\uff08\u5f00\u53d1\uff09",
            "Let's Encrypt\uff08\u751f\u4ea7\uff09",
            "\u81ea\u5df1\u7684\u8bc1\u4e66\u6587\u4ef6",
            "\u65e0\uff08\u4ec5 HTTP\uff09"
        ],
        CertEmailPrompt = "Let's Encrypt \u90ae\u7bb1",
        CertFullchainPrompt = "fullchain.pem \u8def\u5f84",
        CertKeyPrompt = "privkey.pem \u8def\u5f84",

        ResourceBanner = "\u8d44\u6e90\u4f30\u7b97",
        EstRam = "\u4f30\u8ba1\u603b RAM",
        EstDisk = "\u4f30\u8ba1\u78c1\u76d8\u7a7a\u95f4",
        EstCpu = "\u5efa\u8bae CPU \u6838\u5fc3\u6570",
        EstGpuVram = "GPU VRAM\uff08\u6700\u5c0f\uff09",
        EstGpuLocation = "GPU \u4f4d\u7f6e",
        EstGpuNotRequired = "\u4e0d\u9700\u8981",
        NotSelected = "\u672a\u9009\u62e9",
        WarnHeavy = "\u6b64\u914d\u7f6e\u9700\u8981 16+ GB RAM\u3002",
        WarnMedium = "\u6b64\u914d\u7f6e\u9700\u8981 8+ GB RAM\u3002",
        InfoLight = "\u8f7b\u91cf\u914d\u7f6e \u2014 \u5927\u591a\u6570\u673a\u5668\u53ef\u8212\u9002\u8fd0\u884c\u3002",
        WarnNoGpu = "\u5df2\u9009\u62e9 GPU \u670d\u52a1\u4f46\u672a\u914d\u7f6e\u8fdc\u7a0b GPU\u3002"
    };

    // ═══════════════════════════════════════════════
    //  JAPANESE
    // ═══════════════════════════════════════════════
    private static WizardStrings BuildJa() => new()
    {
        BannerTitle = "AudioVerse \u30bb\u30c3\u30c8\u30a2\u30c3\u30d7\u30a6\u30a3\u30b6\u30fc\u30c9",
        BannerSubtitle = "\u3053\u306e\u30a6\u30a3\u30b6\u30fc\u30c9\u306f AudioVerse \u306e\u30c7\u30d7\u30ed\u30a4\u3092\u69cb\u6210\u3057\u307e\u3059\u3002\n  \u57fa\u672c\u30b5\u30fc\u30d3\u30b9\uff08PostgreSQL\u3001Redis\uff09\u306f\u5e38\u306b\u542b\u307e\u308c\u307e\u3059\u3002",
        ProceedPrompt = "\u30d5\u30a1\u30a4\u30eb\u751f\u6210\u3092\u7d9a\u884c\u3057\u307e\u3059\u304b\uff1f",
        Aborted = "\u4e2d\u6b62\u3057\u307e\u3057\u305f\u3002",
        AllFilesGenerated = "\u3059\u3079\u3066\u306e\u30d5\u30a1\u30a4\u30eb\u304c\u751f\u6210\u3055\u308c\u307e\u3057\u305f\u3002",

        Step1Title = "\u30b9\u30c6\u30c3\u30d7 1 \u2014 \u57fa\u672c\u8a2d\u5b9a",
        Step1Desc = "\u30c9\u30e1\u30a4\u30f3\u3068\u74b0\u5883\u3092\u8a2d\u5b9a\u3002'Debug' \u30e2\u30fc\u30c9\u3067\u306f Visual Studio \u304b\u3089 API \u3092\u8d77\u52d5\u3057\u307e\u3059\u3002",
        DomainPrompt = "\u30c9\u30e1\u30a4\u30f3\u540d",
        EnvPrompt = "\u74b0\u5883\uff1a",
        EnvOptions = [
            "Development\uff08\u30c7\u30d5\u30a9\u30eb\u30c8\u3001\u30c7\u30d0\u30c3\u30b0\u30ed\u30b0\uff09",
            "Staging\uff08\u30ea\u30e2\u30fc\u30c8 GPU \u30c6\u30b9\u30c8\uff09",
            "Production\uff08\u6700\u9069\u5316\u3001SSL \u5fc5\u9808\uff09"
        ],
        DeploymentModePrompt = "\u30c7\u30d7\u30ed\u30a4\u30e2\u30fc\u30c9\uff1a",
        DeploymentModeOptions = [
            "\u30d5\u30eb\uff08\u3059\u3079\u3066\u306e\u30b5\u30fc\u30d3\u30b9\u3092 Docker \u3067\u5b9f\u884c\uff09",
            "Debug\uff08API \u306f\u30b3\u30f3\u30c6\u30ca\u5316\u3057\u306a\u3044 \u2014 Visual Studio \u304b\u3089\u5b9f\u884c\uff09"
        ],
        DeploymentModeDebugNote = "Debug \u30e2\u30fc\u30c9\uff1adocker-compose \u306f\u30a4\u30f3\u30d5\u30e9 + AI \u30b5\u30fc\u30d3\u30b9\u306e\u307f\u8d77\u52d5\u3057\u307e\u3059\u3002",

        Step2Title = "\u30b9\u30c6\u30c3\u30d7 2 \u2014 \u30ab\u30e9\u30aa\u30b1\u30b7\u30b9\u30c6\u30e0",
        Step2Desc = "\u30ab\u30e9\u30aa\u30b1\u306f\u30b3\u30a2\u6a5f\u80fd\u3067\u3059\u3002MinIO \u3067\u97f3\u58f0\u30d5\u30a1\u30a4\u30eb\u3092\u4fdd\u5b58\u3002\n  \u5f71\u97ff\uff1a+128 MB RAM\u3001+1 GB \u30c7\u30a3\u30b9\u30af\u3002",
        KaraokePrompt = "\u30ab\u30e9\u30aa\u30b1\u30b7\u30b9\u30c6\u30e0\u3092\u6709\u52b9\u306b\u3057\u307e\u3059\u304b\uff1f",

        Step3Title = "\u30b9\u30c6\u30c3\u30d7 3 \u2014 \u30aa\u30d7\u30b7\u30e7\u30f3\u30a4\u30f3\u30d5\u30e9",
        Step3Desc = "\u8ffd\u52a0\u306e\u30b5\u30fc\u30d3\u30b9\u3002\u30ea\u30bd\u30fc\u30b9\u3092\u5927\u91cf\u306b\u6d88\u8cbb\u3057\u307e\u3059\u3002",
        ElasticsearchPrompt = "Elasticsearch \u3092\u6709\u52b9\u306b\uff1f\uff08+1 GB RAM\uff09",
        KafkaPrompt = "Kafka \u3092\u6709\u52b9\u306b\uff1f\uff08+768 MB RAM\uff09",

        Step4Title = "\u30b9\u30c6\u30c3\u30d7 4 \u2014 AI \u30b5\u30fc\u30d3\u30b9 (utils/ai/)",
        Step4Desc = "Python \u30de\u30a4\u30af\u30ed\u30b5\u30fc\u30d3\u30b9\u3002.NET API \u304c HTTP \u3067\u547c\u3073\u51fa\u3057\u307e\u3059\u3002",
        ConfigureAudioAiPrompt = "\u30aa\u30fc\u30c7\u30a3\u30aa AI \u3092\u69cb\u6210\uff1f",
        ConfigureVideoAiPrompt = "\u30d3\u30c7\u30aa AI \u3092\u69cb\u6210\uff1f",
        LibrosaPrompt = "librosa \u3092\u6709\u52b9\u306b\uff1f\uff08~256 MB\uff09",
        ConfigureMotionAiPrompt = "\u30e2\u30fc\u30b7\u30e7\u30f3 AI \u3092\u69cb\u6210\uff1f\uff08GPU \u5fc5\u8981\uff09",
        MotionAiWarn = "\u5404\u30a8\u30f3\u30b8\u30f3\u306b ~4 GB RAM + 4 GB GPU VRAM \u304c\u5fc5\u8981\u3002",

        Step4bTitle = "\u30b9\u30c6\u30c3\u30d7 4b \u2014 \u751f\u6210 AI",
        Step4bDesc = "\u30b3\u30f3\u30c6\u30f3\u30c4\u751f\u6210\uff1a\u753b\u50cf\u30013D\u30e2\u30c7\u30eb\u3001\u97f3\u97ff\u52b9\u679c\u3001\u97f3\u58f0\u3002GPU \u304c\u5fc5\u8981\u3002",
        ConfigureImageGenPrompt = "\u753b\u50cf\u751f\u6210\u3092\u69cb\u6210\uff1f",
        Configure3dGenPrompt = "3D \u30e2\u30c7\u30eb\u751f\u6210\u3092\u69cb\u6210\uff1f",
        ConfigureSfxGenPrompt = "\u97f3\u97ff\u52b9\u679c\u751f\u6210\u3092\u69cb\u6210\uff1f",
        ConfigureVoicePrompt = "\u97f3\u58f0/TTS \u30b5\u30fc\u30d3\u30b9\u3092\u69cb\u6210\uff1f",

        Step5Title = "\u30b9\u30c6\u30c3\u30d7 5 \u2014 \u30ea\u30e2\u30fc\u30c8 GPU",
        Step5Desc = "GPU \u30b5\u30fc\u30d3\u30b9\u3092\u5225\u306e\u30de\u30b7\u30f3\u3067\u5b9f\u884c\u3067\u304d\u307e\u3059\u3002",
        RemoteGpuPrompt = "GPU \u30b5\u30fc\u30d3\u30b9\u3092\u30ea\u30e2\u30fc\u30c8\u30de\u30b7\u30f3\u3067\u5b9f\u884c\uff1f",
        GpuConnectionPrompt = "\u63a5\u7d9a\u65b9\u6cd5\uff1a",
        GpuConnectionOptions = [
            "Cloudflare Tunnel\uff08\u56fa\u5b9a IP \u4e0d\u8981\uff09",
            "Tailscale VPN\uff08\u5373\u6642\u30bb\u30c3\u30c8\u30a2\u30c3\u30d7\uff09"
        ],
        GpuHostPrompt = "GPU \u30de\u30b7\u30f3\u306e\u30db\u30b9\u30c8\u540d",

        Step6Title = "\u30b9\u30c6\u30c3\u30d7 6 \u2014 \u30bb\u30ad\u30e5\u30ea\u30c6\u30a3",
        Step6Desc = "\u30d1\u30b9\u30ef\u30fc\u30c9\u3001\u30b7\u30fc\u30af\u30ec\u30c3\u30c8\u4fdd\u5b58\u3001SSL/TLS \u8a3c\u660e\u66f8\u3092\u69cb\u6210\u3002",
        AutoPasswordsPrompt = "\u30bb\u30ad\u30e5\u30a2\u306a\u30d1\u30b9\u30ef\u30fc\u30c9\u3092\u81ea\u52d5\u751f\u6210\uff1f",
        DockerSecretsPrompt = "Docker secrets \u3092\u4f7f\u7528\uff1f",
        SslPrompt = "SSL/TLS \u30e2\u30fc\u30c9\uff1a",
        SslOptions = [
            "\u81ea\u5df1\u7f72\u540d\u8a3c\u660e\u66f8\uff08\u958b\u767a\uff09",
            "Let's Encrypt\uff08\u672c\u756a\uff09",
            "\u72ec\u81ea\u306e\u8a3c\u660e\u66f8\u30d5\u30a1\u30a4\u30eb",
            "\u306a\u3057\uff08HTTP \u306e\u307f\uff09"
        ],
        CertEmailPrompt = "Let's Encrypt \u30e1\u30fc\u30eb",
        CertFullchainPrompt = "fullchain.pem \u306e\u30d1\u30b9",
        CertKeyPrompt = "privkey.pem \u306e\u30d1\u30b9",

        ResourceBanner = "\u30ea\u30bd\u30fc\u30b9\u898b\u7a4d\u308a",
        EstRam = "\u63a8\u5b9a\u5408\u8a08 RAM",
        EstDisk = "\u63a8\u5b9a\u30c7\u30a3\u30b9\u30af\u5bb9\u91cf",
        EstCpu = "\u63a8\u5968 CPU \u30b3\u30a2\u6570",
        EstGpuVram = "GPU VRAM\uff08\u6700\u5c0f\uff09",
        EstGpuLocation = "GPU \u5834\u6240",
        EstGpuNotRequired = "\u4e0d\u8981",
        NotSelected = "\u672a\u9078\u629e",
        WarnHeavy = "\u3053\u306e\u69cb\u6210\u306b\u306f 16+ GB RAM \u304c\u5fc5\u8981\u3067\u3059\u3002",
        WarnMedium = "\u3053\u306e\u69cb\u6210\u306b\u306f 8+ GB RAM \u304c\u5fc5\u8981\u3067\u3059\u3002",
        InfoLight = "\u8efd\u91cf\u69cb\u6210 \u2014 \u307b\u3068\u3093\u3069\u306e\u30de\u30b7\u30f3\u3067\u5feb\u9069\u306b\u52d5\u4f5c\u3057\u307e\u3059\u3002",
        WarnNoGpu = "GPU \u30b5\u30fc\u30d3\u30b9\u304c\u9078\u629e\u3055\u308c\u307e\u3057\u305f\u304c\u3001\u30ea\u30e2\u30fc\u30c8 GPU \u304c\u672a\u69cb\u6210\u3067\u3059\u3002"
    };
}
