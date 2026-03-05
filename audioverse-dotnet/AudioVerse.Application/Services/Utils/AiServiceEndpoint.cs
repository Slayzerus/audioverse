namespace AudioVerse.Application.Services.Utils;

/// <summary>
/// Configuration for a single AI service endpoint.
/// Supports local containers, remote Tailscale/Cloudflare Tunnel, or disabled state.
/// </summary>
public class AiServiceEndpoint
{
    /// <summary>Whether this endpoint is enabled. Disabled endpoints are skipped entirely.</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Base URL of the service (e.g. "http://localhost:8300", "https://ai.example.com").</summary>
    public string Url { get; set; } = "";

    /// <summary>
    /// Provider type hint for monitoring/logging.
    /// Values: "local", "docker", "tailscale", "cloudflare", "custom".
    /// </summary>
    public string Provider { get; set; } = "local";

    /// <summary>Request timeout in seconds for this specific endpoint. 0 = use group default.</summary>
    public int TimeoutSeconds { get; set; }

    /// <summary>Number of consecutive failures before circuit opens (stops calling). 0 = disabled.</summary>
    public int CircuitBreakerThreshold { get; set; } = 5;

    /// <summary>How long the circuit stays open (seconds) before a retry probe is sent.</summary>
    public int CircuitBreakerCooldownSeconds { get; set; } = 60;

    /// <summary>Optional API key / auth token for secured remote endpoints.</summary>
    public string? ApiKey { get; set; }

    /// <summary>Optional display label for dashboards.</summary>
    public string? Label { get; set; }
}
