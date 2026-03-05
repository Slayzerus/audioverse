using AudioVerse.Application.Services.Utils;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace AudioVerse.API.HealthChecks;

/// <summary>Health check that aggregates AI service statuses from <see cref="AiHealthMonitor"/>.</summary>
public class AiServicesHealthCheck(AiHealthMonitor monitor) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
    {
        var allHealth = monitor.GetAllHealth();
        if (allHealth.Count == 0)
            return Task.FromResult(HealthCheckResult.Healthy("No AI services configured."));

        var enabled = allHealth.Values.Where(h => h.Status != "disabled").ToList();
        if (enabled.Count == 0)
            return Task.FromResult(HealthCheckResult.Healthy("All AI services disabled."));

        var healthy = enabled.Count(h => h.IsHealthy);
        var total = enabled.Count;

        var data = new Dictionary<string, object>();
        foreach (var h in enabled)
            data[$"{h.Group}:{h.Engine}"] = h.IsHealthy ? "healthy" : h.Status;

        if (healthy == total)
            return Task.FromResult(HealthCheckResult.Healthy($"All {total} AI services healthy.", data));

        if (healthy == 0)
            return Task.FromResult(HealthCheckResult.Unhealthy($"All {total} AI services down.", null, data));

        return Task.FromResult(HealthCheckResult.Degraded($"{healthy}/{total} AI services healthy.", null, data));
    }
}
