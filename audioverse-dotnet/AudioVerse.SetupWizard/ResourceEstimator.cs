namespace AudioVerse.SetupWizard;

public static class ResourceEstimator
{
    public static void PrintEstimate(WizardOptions opts)
    {
        var S = WizardStrings.Get(opts.Language);
        ConsoleHelper.Banner(S.ResourceBanner);

        int totalRamMb = 0;
        int totalDiskMb = 0;
        double totalCores = 0;
        bool needsGpu = false;
        int gpuVramMb = 0;

        void Add(string name, bool enabled, int ramMb, int diskMb, double cores, int vram = 0, string? note = null)
        {
            if (enabled)
            {
                totalRamMb += ramMb;
                totalDiskMb += diskMb;
                totalCores += cores;
                if (vram > 0) { needsGpu = true; gpuVramMb = Math.Max(gpuVramMb, vram); }
                var extra = note != null ? $" ({note})" : "";
                ConsoleHelper.TableRow(name, $"{ramMb} MB RAM, {diskMb / 1024.0:F1} GB disk, {cores:F1} cores{extra}", ConsoleColor.Green);
            }
            else
            {
                ConsoleHelper.TableRow(name, S.NotSelected, ConsoleColor.DarkGray);
            }
        }

        // Essential (always on)
        Add("PostgreSQL", true, 256, 1024, 1.0);
        Add("Redis", true, 64, 0, 0.5);

        // API + Nginx only in non-debug mode
        if (!opts.DebugMode)
        {
            Add("API (.NET 10)", true, 256, 512, 1.5);
            Add("Nginx", true, 32, 0, 0.25);
        }
        else
        {
            ConsoleHelper.TableRow("API (.NET 10)", "Debug \u2014 Visual Studio", ConsoleColor.Yellow);
            ConsoleHelper.TableRow("Nginx", "Debug \u2014 not needed", ConsoleColor.DarkGray);
        }

        // Karaoke
        Add("MinIO (file storage)", opts.EnableKaraoke, 128, 1024, 0.5);

        // Infrastructure
        Add("Elasticsearch", opts.EnableElasticsearch, 1024, 2048, 1.0);
        Add("Kafka + ZooKeeper", opts.EnableKafka, 768, 1024, 1.0);

        // ── utils/ai/ — Audio ──
        Add("audio_analysis", opts.EnableAudioAnalysis, 256, 256, 0.5);
        Add("audio_pitch", opts.EnableAudioPitch, 512, 512, 1.0, 1024, "GPU image");
        Add("audio_rhythm", opts.EnableAudioRhythm, 256, 256, 0.5);
        Add("audio_separate (Demucs)", opts.EnableAudioSeparate, 1024, 1024, 1.0, 2048, "GPU image");
        Add("audio_tags", opts.EnableAudioTags, 256, 256, 0.5);
        Add("audio_tags_panns", opts.EnableAudioTagsPanns, 512, 512, 0.5);
        Add("audio_vad", opts.EnableAudioVad, 256, 256, 0.5);
        Add("sing_score", opts.EnableSingScore, 256, 256, 0.5);
        Add("audiocraft / MusicGen", opts.EnableAudioCraft, 4096, 5120, 2.0, 4096, "GPU recommended");
        Add("riffusion", opts.EnableRiffusion, 2048, 3072, 1.0, 2048, "GPU recommended");
        Add("wavegan", opts.EnableWaveGan, 512, 512, 0.5);

        // ── utils/ai/ — Video ──
        Add("mediapipe", opts.EnableMediaPipe, 512, 1024, 1.0, 1024, "GPU image");
        Add("openpose", opts.EnableOpenPose, 1024, 2048, 1.5, 4096, "GPU required");
        Add("alphapose", opts.EnableAlphaPose, 1024, 2048, 1.5, 4096, "GPU required");
        Add("vitpose", opts.EnableVitPose, 512, 512, 1.0);
        Add("poseformer", opts.EnablePoseFormer, 1024, 1024, 1.5, 2048, "GPU required");

        // ── utils/librosa ──
        Add("librosa", opts.EnableLibrosa, 256, 256, 0.5);

        // ── AI Motion (API/Env/ai-motion/) ──
        Add("MotionGPT", opts.EnableMotionGpt, 4096, 5120, 2.0, 4096, "GPU required");
        Add("MDM (Motion Diffusion)", opts.EnableMdm, 4096, 5120, 2.0, 4096, "GPU required");
        Add("MoMask", opts.EnableMoMask, 4096, 5120, 2.0, 4096, "GPU required");

        // ── Generative AI — Images ──
        Add("ComfyUI (Stable Diffusion)", opts.EnableComfyUi, 4096, 10240, 2.0, 4096, "GPU required");
        Add("SD WebUI / Forge", opts.EnableStableDiffusion, 4096, 10240, 2.0, 4096, "GPU required");

        // ── Generative AI — 3D Models ──
        Add("TripoSR (image→3D)", opts.EnableTripoSr, 4096, 4096, 2.0, 4096, "GPU required");
        Add("Shap-E (text→3D)", opts.EnableShapE, 2048, 3072, 1.5, 2048, "GPU recommended");
        Add("InstantMesh (image→3D)", opts.EnableInstantMesh, 4096, 6144, 2.0, 6144, "GPU required");

        // ── Generative AI — Audio / SFX ──
        Add("Bark (text→audio/SFX)", opts.EnableBark, 4096, 4096, 2.0, 4096, "GPU recommended");
        Add("AudioLDM 2 (text→SFX)", opts.EnableAudioLdm2, 4096, 4096, 2.0, 4096, "GPU required");
        Add("Stable Audio Open", opts.EnableStableAudioOpen, 4096, 4096, 2.0, 4096, "GPU required");

        // ── Generative AI — Voice / TTS ──
        Add("Faster Whisper (ASR)", opts.EnableFasterWhisper, 2048, 3072, 1.5, 2048, "GPU optional");
        Add("Piper TTS", opts.EnablePiperTts, 256, 512, 0.5);
        Add("Coqui XTTS v2", opts.EnableCoquiTts, 2048, 3072, 1.5, 2048, "GPU recommended");
        Add("GPT-SoVITS (sing clone)", opts.EnableGptSoVits, 4096, 5120, 2.0, 4096, "GPU required");
        Add("Fish Speech", opts.EnableFishSpeech, 2048, 3072, 1.5, 2048, "GPU recommended");
        Add("OpenVoice v2", opts.EnableOpenVoice, 1024, 1024, 1.0, 0, "CPU ok");

        // Summary
        Console.WriteLine();
        var separator = new string('\u2500', 50);
        ConsoleHelper.Write($"  {separator}", ConsoleColor.DarkGray);

        ConsoleHelper.TableRow(S.EstRam, FormatSize(totalRamMb), ConsoleColor.Cyan);
        ConsoleHelper.TableRow(S.EstDisk, $"{totalDiskMb / 1024.0:F1} GB (+ your data)", ConsoleColor.Cyan);
        ConsoleHelper.TableRow(S.EstCpu, $"{totalCores:F0}-{totalCores * 1.5:F0}", ConsoleColor.Cyan);

        if (needsGpu)
        {
            ConsoleHelper.TableRow(S.EstGpuVram, $"{gpuVramMb / 1024.0:F0} GB", ConsoleColor.Yellow);
            if (opts.GpuMode != RemoteGpuMode.None)
                ConsoleHelper.TableRow(S.EstGpuLocation, opts.GpuMode == RemoteGpuMode.Tailscale ? "Remote (Tailscale)" : "Remote (Cloudflare Tunnel)", ConsoleColor.Cyan);
            else
                ConsoleHelper.TableRow(S.EstGpuLocation, "Local machine", ConsoleColor.Cyan);
        }
        else
        {
            ConsoleHelper.TableRow("GPU", S.EstGpuNotRequired, ConsoleColor.Green);
        }

        ConsoleHelper.Write($"  {separator}", ConsoleColor.DarkGray);

        // Warnings
        if (totalRamMb > 16384)
            ConsoleHelper.Warn(S.WarnHeavy);
        else if (totalRamMb > 8192)
            ConsoleHelper.Warn(S.WarnMedium);
        else if (totalRamMb <= 2048)
            ConsoleHelper.Info(S.InfoLight);

        if (needsGpu && opts.GpuMode == RemoteGpuMode.None)
            ConsoleHelper.Warn(S.WarnNoGpu);
    }

    private static string FormatSize(int mb) => mb >= 1024 ? $"{mb / 1024.0:F1} GB" : $"{mb} MB";
}
