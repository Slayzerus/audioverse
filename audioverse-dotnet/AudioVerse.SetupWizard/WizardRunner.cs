using System.Text.Json;

namespace AudioVerse.SetupWizard;

public static class WizardRunner
{
    public static WizardOptions RunInteractive(SetupConfig? cfg)
    {
        var opts = new WizardOptions();

        // ── Language selection (always shown in English + native names) ──
        ConsoleHelper.Banner("AudioVerse Setup Wizard");
        Console.WriteLine("  Select wizard language / Wybierz j\u0119zyk kreatora:");
        var langIdx = ConsoleHelper.AskChoice("Language:", WizardStrings.LanguageLabels);
        opts.Language = (WizardLanguage)langIdx;
        var S = WizardStrings.Get(opts.Language);

        ConsoleHelper.Banner(S.BannerTitle);
        Console.WriteLine($"  {S.BannerSubtitle}");

        // ── Step 1: Basic ──
        ConsoleHelper.Section(S.Step1Title);
        ConsoleHelper.Info(S.Step1Desc);

        opts.Domain = ConsoleHelper.Ask(S.DomainPrompt, cfg?.Domain ?? "localhost");
        var envIdx = ConsoleHelper.AskChoice(S.EnvPrompt, S.EnvOptions);
        opts.Environment = envIdx switch { 1 => "Staging", 2 => "Production", _ => "Development" };

        // Deployment mode: Full vs Debug
        var deployIdx = ConsoleHelper.AskChoice(S.DeploymentModePrompt, S.DeploymentModeOptions, 0);
        opts.DebugMode = deployIdx == 1;
        if (opts.DebugMode)
            ConsoleHelper.Info(S.DeploymentModeDebugNote);

        // ── Step 2: Karaoke ──
        ConsoleHelper.Section(S.Step2Title);
        ConsoleHelper.Info(S.Step2Desc);
        opts.EnableKaraoke = ConsoleHelper.AskYesNo(S.KaraokePrompt, true);

        // ── Step 3: Optional Infrastructure ──
        ConsoleHelper.Section(S.Step3Title);
        ConsoleHelper.Info(S.Step3Desc);

        opts.EnableElasticsearch = ConsoleHelper.AskYesNo(S.ElasticsearchPrompt, false);
        opts.EnableKafka = ConsoleHelper.AskYesNo(S.KafkaPrompt, false);

        // ── Step 4: AI Services (from utils/ai/) ──
        ConsoleHelper.Section(S.Step4Title);
        ConsoleHelper.Info(S.Step4Desc);

        // Audio AI
        if (ConsoleHelper.AskYesNo(S.ConfigureAudioAiPrompt, false))
        {
            opts.EnableAudioAnalysis = ConsoleHelper.AskYesNo("    audio_analysis (BPM, key detection \u2014 lightweight, ~256 MB)", false);
            opts.EnableAudioPitch = ConsoleHelper.AskYesNo("    audio_pitch (CREPE + pYIN pitch tracking — ~1.2 GB)", false);
            if (opts.EnableAudioPitch)
            {
                var gpuIdx = ConsoleHelper.AskChoice("      CREPE mode:", ["CPU (default, no GPU needed)", "GPU (NVIDIA CUDA — faster, requires GPU)"]);
                opts.AudioPitchGpu = gpuIdx == 1;
            }
            opts.EnableAudioRhythm = ConsoleHelper.AskYesNo("    audio_rhythm (beat/tempo analysis \u2014 lightweight, ~256 MB)", false);
            opts.EnableAudioSeparate = ConsoleHelper.AskYesNo("    audio_separate / Demucs (vocal isolation \u2014 CPU, ~2 GB, GPU optional)", false);
            opts.EnableAudioTags = ConsoleHelper.AskYesNo("    audio_tags (music tagging \u2014 lightweight, ~256 MB)", false);
            opts.EnableAudioTagsPanns = ConsoleHelper.AskYesNo("    audio_tags_panns (PANNs tagging \u2014 lightweight, ~512 MB)", false);
            opts.EnableAudioVad = ConsoleHelper.AskYesNo("    audio_vad (voice activity detection \u2014 lightweight, ~256 MB)", false);
            opts.EnableSingScore = ConsoleHelper.AskYesNo("    sing_score (singing accuracy scoring \u2014 lightweight, ~256 MB)", false);
            opts.EnableAudioCraft = ConsoleHelper.AskYesNo("    audiocraft / MusicGen (music generation \u2014 ~4 GB RAM, GPU recommended)", false);
            opts.EnableRiffusion = ConsoleHelper.AskYesNo("    riffusion (music from text \u2014 ~2 GB RAM, GPU recommended)", false);
            opts.EnableWaveGan = ConsoleHelper.AskYesNo("    wavegan (waveform GAN \u2014 experimental, ~512 MB)", false);
        }

        // Video AI
        if (ConsoleHelper.AskYesNo(S.ConfigureVideoAiPrompt, false))
        {
            opts.EnableMediaPipe = ConsoleHelper.AskYesNo("    mediapipe (lightweight pose \u2014 GPU image, ~512 MB)", false);
            opts.EnableOpenPose = ConsoleHelper.AskYesNo("    openpose (multi-person pose \u2014 GPU required, ~1 GB)", false);
            opts.EnableAlphaPose = ConsoleHelper.AskYesNo("    alphapose (high accuracy \u2014 GPU required, ~1 GB)", false);
            opts.EnableVitPose = ConsoleHelper.AskYesNo("    vitpose (ViT-based pose \u2014 lightweight, ~512 MB)", false);
            opts.EnablePoseFormer = ConsoleHelper.AskYesNo("    poseformer (3D pose from video \u2014 GPU required, ~1 GB)", false);
        }

        // Librosa
        opts.EnableLibrosa = ConsoleHelper.AskYesNo(S.LibrosaPrompt, false);

        // Motion AI
        if (ConsoleHelper.AskYesNo(S.ConfigureMotionAiPrompt, false))
        {
            ConsoleHelper.Warn($"  {S.MotionAiWarn}");
            opts.EnableMotionGpt = ConsoleHelper.AskYesNo("    MotionGPT (easiest to dockerize)", false);
            opts.EnableMdm = ConsoleHelper.AskYesNo("    MDM \u2014 Motion Diffusion Model (well documented)", false);
            opts.EnableMoMask = ConsoleHelper.AskYesNo("    MoMask (newer, best quality)", false);
        }

        // ── Step 4b: Generative AI ──
        ConsoleHelper.Section(S.Step4bTitle);
        ConsoleHelper.Info(S.Step4bDesc);

        // Image generation
        if (ConsoleHelper.AskYesNo(S.ConfigureImageGenPrompt, false))
        {
            opts.EnableComfyUi = ConsoleHelper.AskYesNo("    ComfyUI (Stable Diffusion backend \u2014 ~4 GB VRAM)", false);
            opts.EnableStableDiffusion = ConsoleHelper.AskYesNo("    Stable Diffusion WebUI / Forge (~4 GB VRAM)", false);
        }

        // 3D model generation
        if (ConsoleHelper.AskYesNo(S.Configure3dGenPrompt, false))
        {
            opts.EnableTripoSr = ConsoleHelper.AskYesNo("    TripoSR (image\u21923D \u2014 ~4 GB VRAM)", false);
            opts.EnableShapE = ConsoleHelper.AskYesNo("    Shap-E (text\u21923D \u2014 ~2 GB VRAM)", false);
            opts.EnableInstantMesh = ConsoleHelper.AskYesNo("    InstantMesh (image\u21923D \u2014 ~6 GB VRAM)", false);
        }

        // Audio / SFX generation
        if (ConsoleHelper.AskYesNo(S.ConfigureSfxGenPrompt, false))
        {
            opts.EnableBark = ConsoleHelper.AskYesNo("    Bark (text\u2192speech+music+SFX \u2014 ~4 GB VRAM)", false);
            opts.EnableAudioLdm2 = ConsoleHelper.AskYesNo("    AudioLDM 2 (text\u2192SFX \u2014 ~4 GB VRAM)", false);
            opts.EnableStableAudioOpen = ConsoleHelper.AskYesNo("    Stable Audio Open (text\u2192music \u2014 ~4 GB VRAM)", false);
        }

        // Voice / TTS
        if (ConsoleHelper.AskYesNo(S.ConfigureVoicePrompt, false))
        {
            opts.EnableFasterWhisper = ConsoleHelper.AskYesNo("    Faster Whisper (ASR \u2014 ~2 GB RAM)", false);
            opts.EnablePiperTts = ConsoleHelper.AskYesNo("    Piper TTS (lightweight \u2014 ~256 MB, CPU only)", false);
            opts.EnableCoquiTts = ConsoleHelper.AskYesNo("    Coqui XTTS v2 (multi-language TTS \u2014 ~2 GB VRAM)", false);
            opts.EnableGptSoVits = ConsoleHelper.AskYesNo("    GPT-SoVITS (singing voice cloning \u2014 ~4 GB VRAM)", false);
            opts.EnableFishSpeech = ConsoleHelper.AskYesNo("    Fish Speech (multilingual TTS \u2014 ~2 GB VRAM)", false);
            opts.EnableOpenVoice = ConsoleHelper.AskYesNo("    OpenVoice v2 (voice cloning \u2014 ~1 GB, CPU ok)", false);
        }

        // ── Step 5: Remote GPU ──
        if (opts.HasAnyGpuService)
        {
            ConsoleHelper.Section(S.Step5Title);
            ConsoleHelper.Info(S.Step5Desc);

            if (ConsoleHelper.AskYesNo(S.RemoteGpuPrompt, false))
            {
                var gpuIdx = ConsoleHelper.AskChoice(S.GpuConnectionPrompt, S.GpuConnectionOptions);
                opts.GpuMode = gpuIdx == 1 ? RemoteGpuMode.Tailscale : RemoteGpuMode.CloudflareTunnel;
                opts.GpuHostname = ConsoleHelper.Ask(S.GpuHostPrompt, "100.64.0.2");
            }
        }

        // ── Step 6: Security ──
        ConsoleHelper.Section(S.Step6Title);
        ConsoleHelper.Info(S.Step6Desc);

        opts.AutoGeneratePasswords = ConsoleHelper.AskYesNo(S.AutoPasswordsPrompt, true);
        opts.UseDockerSecrets = ConsoleHelper.AskYesNo(S.DockerSecretsPrompt, false);

        var sslIdx = ConsoleHelper.AskChoice(S.SslPrompt, S.SslOptions);
        opts.SslMode = sslIdx switch
        {
            1 => SslMode.LetsEncrypt,
            2 => SslMode.BringYourOwn,
            3 => SslMode.None,
            _ => SslMode.SelfSigned
        };

        if (opts.SslMode == SslMode.LetsEncrypt)
        {
            opts.EnableCertbot = true;
            opts.CertEmail = ConsoleHelper.Ask(S.CertEmailPrompt, cfg?.Email ?? "");
        }
        else if (opts.SslMode == SslMode.BringYourOwn)
        {
            opts.CertFullchainPath = ConsoleHelper.Ask(S.CertFullchainPrompt, cfg?.CertFullchainPath ?? "");
            opts.CertKeyPath = ConsoleHelper.Ask(S.CertKeyPrompt, cfg?.CertKeyPath ?? "");
        }

        // ── Resource estimate ──
        ResourceEstimator.PrintEstimate(opts);

        return opts;
    }

    public static async Task<DeploymentSecrets> GenerateFilesAsync(string targetRoot, WizardOptions opts, SetupConfig? cfg)
    {
        ConsoleHelper.Section("GENERATING FILES");

        var secrets = new DeploymentSecrets
        {
            PostgresUser = cfg?.PostgresUser ?? "audioverse",
            PostgresPassword = cfg?.PostgresPassword ?? (opts.AutoGeneratePasswords ? SecretGenerator.GeneratePassword(24) : "changeme"),
            MinioUser = cfg?.MinioUser ?? "minioadmin",
            MinioPassword = cfg?.MinioPassword ?? (opts.AutoGeneratePasswords ? SecretGenerator.GeneratePassword(24) : "changeme"),
            RedisPassword = cfg?.RedisPassword ?? (opts.AutoGeneratePasswords ? SecretGenerator.GeneratePassword(16) : "changeme"),
            JwtSecret = cfg?.JwtSecret ?? (opts.AutoGeneratePasswords ? SecretGenerator.GeneratePassword(32) : "changeme")
        };

        var force = opts.Force;

        await FileHelper.WriteIfChangedAsync(
            Path.Combine(targetRoot, "docker-compose.yml"),
            DockerComposeTemplate.Generate(opts, opts.UseDockerSecrets), force);

        // Override & Nginx only in non-debug mode (debug has no API container)
        if (!opts.DebugMode)
        {
            await FileHelper.WriteIfChangedAsync(
                Path.Combine(targetRoot, "docker-compose.override.yml"),
                DockerComposeOverrideTemplate.Generate(), force);

            await FileHelper.WriteIfChangedAsync(
                Path.Combine(targetRoot, "nginx", "nginx.conf"),
                NginxTemplate.Generate(opts.Domain), force);

            await FileHelper.WriteIfChangedAsync(
                Path.Combine(targetRoot, "scripts", "generate-cert.sh"),
                CertScriptTemplate.GenerateSh(), force);

            await FileHelper.WriteIfChangedAsync(
                Path.Combine(targetRoot, "scripts", "generate-cert.ps1"),
                CertScriptTemplate.GeneratePs1(), force);
        }

        await FileHelper.WriteIfChangedAsync(
            Path.Combine(targetRoot, ".env"),
            EnvTemplate.Generate(secrets, opts.UseDockerSecrets), force);

        await FileHelper.WriteIfChangedAsync(
            Path.Combine(targetRoot, "INSTALL.md"),
            InstallReadmeTemplate.Generate(opts), force);

        if (opts.UseDockerSecrets)
        {
            var secretsDir = Path.Combine(targetRoot, "secrets");
            Directory.CreateDirectory(secretsDir);
            await File.WriteAllTextAsync(Path.Combine(secretsDir, "postgres_password.txt"), secrets.PostgresPassword);
            await File.WriteAllTextAsync(Path.Combine(secretsDir, "minio_password.txt"), secrets.MinioPassword);
            await File.WriteAllTextAsync(Path.Combine(secretsDir, "redis_password.txt"), secrets.RedisPassword);
            ConsoleHelper.Success("Docker secrets written to ./secrets/");

            var gitignorePath = Path.Combine(targetRoot, ".gitignore");
            try
            {
                var gitignore = File.Exists(gitignorePath) ? await File.ReadAllTextAsync(gitignorePath) : "";
                if (!gitignore.Contains("/secrets/"))
                {
                    await File.AppendAllTextAsync(gitignorePath, Environment.NewLine + "/secrets/" + Environment.NewLine);
                    ConsoleHelper.Success("Added /secrets/ to .gitignore");
                }
            }
            catch { /* non-fatal */ }
        }

        if (opts.SslMode == SslMode.BringYourOwn && !string.IsNullOrEmpty(opts.CertFullchainPath) && !string.IsNullOrEmpty(opts.CertKeyPath))
        {
            var certsDir = Path.Combine(targetRoot, "certs");
            Directory.CreateDirectory(certsDir);
            try
            {
                File.Copy(opts.CertFullchainPath, Path.Combine(certsDir, "fullchain.pem"), true);
                File.Copy(opts.CertKeyPath, Path.Combine(certsDir, "privkey.pem"), true);
                ConsoleHelper.Success("Copied certificate files to ./certs/");
            }
            catch (Exception ex)
            {
                ConsoleHelper.Error($"Failed to copy cert files: {ex.Message}");
            }
        }

        // Save wizard options for re-run
        var wizardJson = JsonSerializer.Serialize(opts, new JsonSerializerOptions { WriteIndented = true });
        await File.WriteAllTextAsync(Path.Combine(targetRoot, "setupwizard-last.json"), wizardJson);

        // Patch appsettings.Development.json and appsettings.json in .NET projects so Visual Studio debug works and classic config is always up to date
        await PatchDevAppSettingsAsync(targetRoot, secrets, opts);
        await PatchAppSettingsJsonAsync(targetRoot, secrets, opts);

        ConsoleHelper.Success("All files generated. Run 'docker compose up -d' to start.");

        return secrets;
    }

    private static async Task PatchDevAppSettingsAsync(string targetRoot, DeploymentSecrets secrets, WizardOptions opts)
    {
        // targetRoot is installer/ — .NET projects are in ../audioverse-dotnet/
        var dotnetRoot = Path.GetFullPath(Path.Combine(targetRoot, "..", "audioverse-dotnet"));
        if (!Directory.Exists(dotnetRoot))
            return;

        int port = 5432;
        var connBase = $"Host=localhost;Port={port};Database=audioverse_db;Username={secrets.PostgresUser};Password={secrets.PostgresPassword}";
        var connApi = connBase + ";Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;Connection Lifetime=300;Connection Idle Lifetime=60;Timeout=30;Command Timeout=30;";

        var projects = new[]
        {
            ("AudioVerse.API", connApi),
            ("AudioVerse.IdentityServer", connBase)
        };

        foreach (var (project, conn) in projects)
        {
            var devSettings = Path.Combine(dotnetRoot, project, "appsettings.Development.json");
            if (!File.Exists(devSettings))
                continue;

            try
            {
                var json = JsonSerializer.Deserialize<JsonElement>(await File.ReadAllTextAsync(devSettings));
                var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(json.GetRawText())
                           ?? new Dictionary<string, object>();

                var connStrings = new Dictionary<string, string> { ["PostgresConnection"] = conn };
                if (project == "AudioVerse.API")
                {
                    connStrings["Redis"] = "localhost:6379";
                    connStrings["Minio"] = "http://localhost:9000";
                }

                dict["ConnectionStrings"] = connStrings;

                // Patch Minio credentials for API project
                if (project == "AudioVerse.API")
                {
                    dict["Minio"] = new Dictionary<string, string>
                    {
                        ["AccessKey"] = secrets.MinioUser,
                        ["SecretKey"] = secrets.MinioPassword
                    };
                }

                var output = JsonSerializer.Serialize(dict, new JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(devSettings, output);
                ConsoleHelper.Success($"Updated {project}/appsettings.Development.json with DB credentials");
            }
            catch (Exception ex)
            {
                ConsoleHelper.Warn($"Could not update {project}/appsettings.Development.json: {ex.Message}");
            }
        }
    }

    private static async Task PatchAppSettingsJsonAsync(string targetRoot, DeploymentSecrets secrets, WizardOptions opts)
    {
        var dotnetRoot = Path.GetFullPath(Path.Combine(targetRoot, "..", "audioverse-dotnet"));
        if (!Directory.Exists(dotnetRoot))
            return;

        int port = 5432;
        var connBase = $"Host=localhost;Port={port};Database=audioverse_db;Username={secrets.PostgresUser};Password={secrets.PostgresPassword}";
        var connApi = connBase + ";Pooling=true;Minimum Pool Size=5;Maximum Pool Size=100;Connection Lifetime=300;Connection Idle Lifetime=60;Timeout=30;Command Timeout=30;";

        var projects = new[]
        {
            ("AudioVerse.API", connApi),
            ("AudioVerse.IdentityServer", connBase)
        };

        foreach (var (project, conn) in projects)
        {
            var settingsPath = Path.Combine(dotnetRoot, project, "appsettings.json");
            if (!File.Exists(settingsPath))
                continue;

            try
            {
                var json = JsonSerializer.Deserialize<JsonElement>(await File.ReadAllTextAsync(settingsPath));
                var dict = JsonSerializer.Deserialize<Dictionary<string, object>>(json.GetRawText())
                           ?? new Dictionary<string, object>();

                if (dict.TryGetValue("ConnectionStrings", out var connSection) && connSection is JsonElement connElem)
                {
                    var connDict = JsonSerializer.Deserialize<Dictionary<string, string>>(connElem.GetRawText())
                                   ?? new Dictionary<string, string>();
                    connDict["PostgresConnection"] = conn;
                    if (project == "AudioVerse.API")
                        connDict["Minio"] = "http://localhost:9000";
                    dict["ConnectionStrings"] = connDict;
                }
                else
                {
                    var connDict = new Dictionary<string, string> { ["PostgresConnection"] = conn };
                    if (project == "AudioVerse.API")
                    {
                        connDict["Redis"] = "localhost:6379";
                        connDict["Minio"] = "http://localhost:9000";
                    }
                    dict["ConnectionStrings"] = connDict;
                }

                // Patch Minio credentials for API project
                if (project == "AudioVerse.API")
                {
                    dict["Minio"] = new Dictionary<string, string>
                    {
                        ["AccessKey"] = secrets.MinioUser,
                        ["SecretKey"] = secrets.MinioPassword
                    };
                }

                var output = JsonSerializer.Serialize(dict, new JsonSerializerOptions { WriteIndented = true });
                await File.WriteAllTextAsync(settingsPath, output);
                ConsoleHelper.Success($"Patched {project}/appsettings.json with DB credentials");
            }
            catch (Exception ex)
            {
                ConsoleHelper.Warn($"Could not patch {project}/appsettings.json: {ex.Message}");
            }
        }
    }
}
