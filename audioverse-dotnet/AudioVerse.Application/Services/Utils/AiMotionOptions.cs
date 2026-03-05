namespace AudioVerse.Application.Services.Utils;

/// <summary>
/// Configuration for text-to-motion AI engines (MotionGPT, MDM, MoMask).
/// Each engine runs as a separate Python sidecar container.
/// </summary>
public class AiMotionOptions
{
    /// <summary>MotionGPT sidecar base URL.</summary>
    public string MotionGptUrl { get; set; } = "http://localhost:8300";

    /// <summary>MDM (Motion Diffusion Model) sidecar base URL.</summary>
    public string MdmUrl { get; set; } = "http://localhost:8301";

    /// <summary>MoMask sidecar base URL.</summary>
    public string MoMaskUrl { get; set; } = "http://localhost:8302";

    /// <summary>Timeout per engine in seconds.</summary>
    public int TimeoutSeconds { get; set; } = 120;
}
