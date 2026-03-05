using AudioVerse.Application.Services.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace AudioVerse.API.Areas.Utils;

/// <summary>
/// Admin dashboard for all AI services — health, configuration, circuit breaker status.
/// Single endpoint to see which engines are running, where, and if they're healthy.
/// </summary>
[ApiController]
[Route("api/ai/status")]
[Produces("application/json")]
[Tags("AI - Status")]
public class AiStatusController(
    IOptions<AiServicesOptions> options,
    AiCircuitBreaker breaker,
    AiHealthMonitor monitor) : ControllerBase
{
    /// <summary>
    /// Full dashboard — all AI service endpoints with health, provider, and circuit breaker status.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetStatus()
    {
        var opts = options.Value;
        var health = monitor.GetAllHealth();
        var circuits = breaker.GetSnapshot();

        return Ok(new
        {
            globalEnabled = opts.Enabled,
            healthCheckIntervalSeconds = opts.HealthCheckIntervalSeconds,
            defaultTimeoutSeconds = opts.DefaultTimeoutSeconds,
            groups = new
            {
                audio = BuildGroup("audio", opts.Audio, health, circuits),
                video = BuildGroup("video", opts.Video, health, circuits),
                motion = BuildGroup("motion", opts.Motion, health, circuits),
                generative = BuildGroup("generative", opts.Generative, health, circuits)
            }
        });
    }

    /// <summary>
    /// Quick summary — just engine names and up/down status.
    /// </summary>
    [HttpGet("summary")]
    [AllowAnonymous]
    public IActionResult GetSummary()
    {
        var health = monitor.GetAllHealth();
        return Ok(health.Values.Select(h => new
        {
            h.Engine,
            h.Group,
            h.IsHealthy,
            h.Provider,
            h.Status
        }));
    }

    private static object[] BuildGroup(
        string group,
        Dictionary<string, AiServiceEndpoint> endpoints,
        IReadOnlyDictionary<string, AiEndpointHealth> health,
        IReadOnlyDictionary<string, CircuitStatus> circuits)
    {
        return endpoints.Select(kvp =>
        {
            var key = $"{group}:{kvp.Key}";
            health.TryGetValue(key, out var h);
            circuits.TryGetValue(key, out var c);

            return (object)new
            {
                engine = kvp.Key,
                enabled = kvp.Value.Enabled,
                url = kvp.Value.Url,
                provider = kvp.Value.Provider,
                label = kvp.Value.Label,
                timeout = kvp.Value.TimeoutSeconds,
                healthy = h?.IsHealthy ?? false,
                status = h?.Status ?? "unknown",
                lastChecked = h?.LastCheckedUtc,
                circuit = c != null ? new
                {
                    failures = c.ConsecutiveFailures,
                    lastFailure = c.LastFailureUtc,
                    isProbing = c.IsProbing
                } : null
            };
        }).ToArray();
    }
}
