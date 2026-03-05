using System.Collections.Concurrent;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace AudioVerse.Application.Services.Utils;

/// <summary>
/// Background service that periodically probes all configured AI service endpoints.
/// Updates the shared health status cache consumed by controllers and services.
/// </summary>
public class AiHealthMonitor : BackgroundService
{
    private readonly AiServicesOptions _options;
    private readonly AiCircuitBreaker _breaker;
    private readonly IHttpClientFactory _httpFactory;
    private readonly ILogger<AiHealthMonitor> _logger;

    private readonly ConcurrentDictionary<string, AiEndpointHealth> _healthCache = new();

    public AiHealthMonitor(
        IOptions<AiServicesOptions> options,
        AiCircuitBreaker breaker,
        IHttpClientFactory httpFactory,
        ILogger<AiHealthMonitor> logger)
    {
        _options = options.Value;
        _breaker = breaker;
        _httpFactory = httpFactory;
        _logger = logger;
    }

    /// <summary>Get cached health status for all endpoints.</summary>
    public IReadOnlyDictionary<string, AiEndpointHealth> GetAllHealth() =>
        _healthCache.ToDictionary(kv => kv.Key, kv => kv.Value);

    /// <summary>Check if a specific endpoint is healthy (last probe succeeded).</summary>
    public bool IsHealthy(string group, string engine) =>
        _healthCache.TryGetValue($"{group}:{engine}", out var h) && h.IsHealthy;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_options.Enabled || _options.HealthCheckIntervalSeconds <= 0)
        {
            _logger.LogInformation("AI health monitoring disabled");
            return;
        }

        _logger.LogInformation("AI health monitor started (interval: {Interval}s)", _options.HealthCheckIntervalSeconds);

        // Initial probe
        await ProbeAllAsync(stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(_options.HealthCheckIntervalSeconds), stoppingToken);
            await ProbeAllAsync(stoppingToken);
        }
    }

    private async Task ProbeAllAsync(CancellationToken ct)
    {
        var tasks = new List<Task>();

        foreach (var (name, ep) in _options.Audio)
            tasks.Add(ProbeEndpointAsync("audio", name, ep, ct));

        foreach (var (name, ep) in _options.Video)
            tasks.Add(ProbeEndpointAsync("video", name, ep, ct));

        foreach (var (name, ep) in _options.Motion)
            tasks.Add(ProbeEndpointAsync("motion", name, ep, ct));

        foreach (var (name, ep) in _options.Generative)
            tasks.Add(ProbeEndpointAsync("generative", name, ep, ct));

        await Task.WhenAll(tasks);
    }

    private async Task ProbeEndpointAsync(string group, string name, AiServiceEndpoint ep, CancellationToken ct)
    {
        var key = $"{group}:{name}";

        if (!ep.Enabled || string.IsNullOrEmpty(ep.Url))
        {
            _healthCache[key] = new AiEndpointHealth(name, group, ep.Url, ep.Provider, false, "disabled", null);
            return;
        }

        try
        {
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            cts.CancelAfter(TimeSpan.FromSeconds(5));

            var client = _httpFactory.CreateClient();
            if (!string.IsNullOrEmpty(ep.ApiKey))
                client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ep.ApiKey);

            var resp = await client.GetAsync($"{ep.Url.TrimEnd('/')}/health", cts.Token);
            var ok = resp.IsSuccessStatusCode;

            if (ok) _breaker.RecordSuccess(key);
            else _breaker.RecordFailure(key);

            _healthCache[key] = new AiEndpointHealth(name, group, ep.Url, ep.Provider, ok,
                ok ? "healthy" : $"http_{(int)resp.StatusCode}", DateTime.UtcNow);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or OperationCanceledException)
        {
            _breaker.RecordFailure(key);
            _healthCache[key] = new AiEndpointHealth(name, group, ep.Url, ep.Provider, false,
                ex is TaskCanceledException ? "timeout" : "unreachable", DateTime.UtcNow);
        }
    }
}
