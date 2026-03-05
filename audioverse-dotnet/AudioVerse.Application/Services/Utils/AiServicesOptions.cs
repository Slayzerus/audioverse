namespace AudioVerse.Application.Services.Utils;

/// <summary>
/// Centralized configuration for all AI service groups.
/// Each group (Audio, Video, Motion) contains named endpoints that can be
/// individually enabled/disabled and pointed at local or remote hosts.
/// </summary>
public class AiServicesOptions
{
    /// <summary>Global kill-switch for all AI services.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Default request timeout in seconds (used when endpoint-specific timeout is 0).</summary>
    public int DefaultTimeoutSeconds { get; set; } = 60;

    /// <summary>Interval in seconds for background health monitoring. 0 = disabled.</summary>
    public int HealthCheckIntervalSeconds { get; set; } = 30;

    /// <summary>Audio AI service endpoints (keyed by engine name).</summary>
    public Dictionary<string, AiServiceEndpoint> Audio { get; set; } = new();

    /// <summary>Video AI service endpoints (keyed by engine name).</summary>
    public Dictionary<string, AiServiceEndpoint> Video { get; set; } = new();

    /// <summary>Motion AI service endpoints (keyed by engine name).</summary>
    public Dictionary<string, AiServiceEndpoint> Motion { get; set; } = new();

    /// <summary>Generative AI service endpoints — images, 3D, SFX, voice (keyed by engine name).</summary>
    public Dictionary<string, AiServiceEndpoint> Generative { get; set; } = new();

    /// <summary>Get effective timeout for an endpoint.</summary>
    public int GetTimeout(AiServiceEndpoint endpoint) =>
        endpoint.TimeoutSeconds > 0 ? endpoint.TimeoutSeconds : DefaultTimeoutSeconds;
}
