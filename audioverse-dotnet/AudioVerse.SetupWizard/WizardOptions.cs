namespace AudioVerse.SetupWizard;

public class WizardOptions
{
    // ── Basic ──
    public string Domain { get; set; } = "localhost";
    public string Environment { get; set; } = "Development";

    // ── Deployment mode ──
    /// <summary>
    /// When true, docker-compose does NOT include AudioVerse.API container.
    /// The developer runs the API from Visual Studio / IDE with F5.
    /// Infrastructure + AI services are still started in Docker.
    /// </summary>
    public bool DebugMode { get; set; }

    // ── Language ──
    public WizardLanguage Language { get; set; } = WizardLanguage.English;

    // ── Karaoke (default ON) ──
    public bool EnableKaraoke { get; set; } = true;

    // ── Infrastructure (default OFF) ──
    public bool EnableElasticsearch { get; set; }
    public bool EnableKafka { get; set; }

    // ── Utils: AI Audio (from utils/ai/*) ──
    public bool EnableAudioAnalysis { get; set; }
    public bool EnableAudioPitch { get; set; }
    /// <summary>When true, audio_pitch uses GPU (CUDA) Dockerfile; false = CPU-only.</summary>
    public bool AudioPitchGpu { get; set; }
    public bool EnableAudioRhythm { get; set; }
    public bool EnableAudioSeparate { get; set; }
    public bool EnableAudioTags { get; set; }
    public bool EnableAudioTagsPanns { get; set; }
    public bool EnableAudioVad { get; set; }
    public bool EnableSingScore { get; set; }
    public bool EnableAudioCraft { get; set; }
    public bool EnableRiffusion { get; set; }
    public bool EnableWaveGan { get; set; }

    // ── Utils: AI Video (from utils/ai/*) ──
    public bool EnableMediaPipe { get; set; }
    public bool EnableOpenPose { get; set; }
    public bool EnableAlphaPose { get; set; }
    public bool EnableVitPose { get; set; }
    public bool EnablePoseFormer { get; set; }

    // ── Utils: Librosa ──
    public bool EnableLibrosa { get; set; }

    // ── AI Motion (from API/Env/ai-motion/*) ──
    public bool EnableMotionGpt { get; set; }
    public bool EnableMdm { get; set; }
    public bool EnableMoMask { get; set; }

    // ── Generative AI — Images ──
    public bool EnableComfyUi { get; set; }
    public bool EnableStableDiffusion { get; set; }

    // ── Generative AI — 3D Models ──
    public bool EnableTripoSr { get; set; }
    public bool EnableShapE { get; set; }
    public bool EnableInstantMesh { get; set; }

    // ── Generative AI — Audio / SFX ──
    public bool EnableBark { get; set; }
    public bool EnableAudioLdm2 { get; set; }
    public bool EnableStableAudioOpen { get; set; }

    // ── Generative AI — Voice / TTS ──
    public bool EnableGptSoVits { get; set; }
    public bool EnableFishSpeech { get; set; }
    public bool EnableOpenVoice { get; set; }
    public bool EnableFasterWhisper { get; set; }
    public bool EnablePiperTts { get; set; }
    public bool EnableCoquiTts { get; set; }

    // ── Security ──
    public bool AutoGeneratePasswords { get; set; } = true;
    public bool UseDockerSecrets { get; set; }
    public SslMode SslMode { get; set; } = SslMode.SelfSigned;
    public string? CertEmail { get; set; }
    public string? CertFullchainPath { get; set; }
    public string? CertKeyPath { get; set; }

    // ── Remote GPU ──
    public RemoteGpuMode GpuMode { get; set; } = RemoteGpuMode.None;
    public string? GpuHostname { get; set; }

    // ── Flags ──
    public bool Force { get; set; }
    public bool Apply { get; set; }
    public bool EnableCertbot { get; set; }

    // ── Computed ──
    public bool HasAnyAiAudio => EnableAudioAnalysis || EnableAudioPitch || EnableAudioRhythm
        || EnableAudioSeparate || EnableAudioTags || EnableAudioTagsPanns || EnableAudioVad
        || EnableSingScore || EnableAudioCraft || EnableRiffusion || EnableWaveGan;
    public bool HasAnyAiVideo => EnableMediaPipe || EnableOpenPose || EnableAlphaPose || EnableVitPose || EnablePoseFormer;
    public bool HasAnyAiMotion => EnableMotionGpt || EnableMdm || EnableMoMask;
    public bool HasAnyGenImage => EnableComfyUi || EnableStableDiffusion;
    public bool HasAnyGen3D => EnableTripoSr || EnableShapE || EnableInstantMesh;
    public bool HasAnyGenAudio => EnableBark || EnableAudioLdm2 || EnableStableAudioOpen;
    public bool HasAnyGenVoice => EnableGptSoVits || EnableFishSpeech || EnableOpenVoice
        || EnableFasterWhisper || EnablePiperTts || EnableCoquiTts;
    public bool HasAnyGenerative => HasAnyGenImage || HasAnyGen3D || HasAnyGenAudio || HasAnyGenVoice;
    public bool HasAnyAi => HasAnyAiAudio || HasAnyAiVideo || HasAnyAiMotion || HasAnyGenerative || EnableLibrosa;
    public bool HasAnyGpuService => EnableAudioCraft
        || (EnableAudioPitch && AudioPitchGpu)
        || EnableRiffusion || EnableOpenPose || EnableAlphaPose || EnableMediaPipe
        || EnablePoseFormer || EnableMotionGpt || EnableMdm || EnableMoMask
        || EnableComfyUi || EnableStableDiffusion || EnableTripoSr || EnableShapE
        || EnableInstantMesh || EnableBark || EnableAudioLdm2 || EnableStableAudioOpen
        || EnableGptSoVits;
}
