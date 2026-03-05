using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace AudioVerse.API.HealthChecks;

/// <summary>Health check verifying Redis connectivity (optional — degrades gracefully).</summary>
public class RedisHealthCheck(IConnectionMultiplexer? redis = null) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken ct = default)
    {
        if (redis == null)
            return Task.FromResult(HealthCheckResult.Degraded("Redis not configured."));

        try
        {
            var db = redis.GetDatabase();
            var pingResult = db.Ping();
            return Task.FromResult(pingResult.TotalMilliseconds < 5000
                ? HealthCheckResult.Healthy($"Redis OK ({pingResult.TotalMilliseconds:F0}ms).")
                : HealthCheckResult.Degraded($"Redis slow ({pingResult.TotalMilliseconds:F0}ms)."));
        }
        catch (Exception ex)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy("Redis unreachable.", ex));
        }
    }
}
