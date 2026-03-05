using AudioVerse.Application.Models.Utils;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Diagnostics;
using System.Net.Http.Json;

namespace AudioVerse.Application.Services.Utils;

/// <summary>
/// Text-to-motion service calling Python sidecar containers.
/// Uses centralized AiServicesOptions for endpoint config, circuit breaking, and enable/disable.
/// Falls back to legacy AiMotionOptions if AiServices:Motion is not configured.
/// </summary>
public class AiMotionService : IAiMotionService
{
    private readonly HttpClient _http;
    private readonly AiMotionOptions _legacyOptions;
    private readonly AiServicesOptions _servicesOptions;
    private readonly AiCircuitBreaker _breaker;
    private readonly ILogger<AiMotionService> _logger;

    private static readonly string[] AllEngines = ["motiongpt", "mdm", "momask"];

    public AiMotionService(
        HttpClient http,
        IOptions<AiMotionOptions> legacyOptions,
        IOptions<AiServicesOptions> servicesOptions,
        AiCircuitBreaker breaker,
        ILogger<AiMotionService> logger)
    {
        _http = http;
        _legacyOptions = legacyOptions.Value;
        _servicesOptions = servicesOptions.Value;
        _breaker = breaker;
        _logger = logger;
        _http.Timeout = TimeSpan.FromSeconds(
            _servicesOptions.Motion.Count > 0 ? _servicesOptions.DefaultTimeoutSeconds : _legacyOptions.TimeoutSeconds);
    }

    public async Task<MotionGenerationResult?> GenerateAsync(string prompt, string engine, double durationSec = 4.0, double fps = 20.0, CancellationToken ct = default)
    {
        var (baseUrl, endpoint) = ResolveEndpoint(engine);
        if (baseUrl == null)
            return null;

        if (endpoint != null && !endpoint.Enabled)
            return ErrorResult(engine, prompt, durationSec, 0, "Engine disabled in configuration");

        var circuitKey = $"motion:{engine}";
        if (endpoint != null && _breaker.IsOpen(circuitKey, endpoint.CircuitBreakerThreshold, endpoint.CircuitBreakerCooldownSeconds))
        {
            _logger.LogWarning("Motion engine {Engine} circuit is open — skipping call", engine);
            return ErrorResult(engine, prompt, durationSec, 0, "Circuit breaker open — engine temporarily unavailable");
        }

        var sw = Stopwatch.StartNew();
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/generate");
            if (!string.IsNullOrEmpty(endpoint?.ApiKey))
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", endpoint.ApiKey);
            request.Content = JsonContent.Create(new { prompt, duration_sec = durationSec, fps });

            using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            var timeout = endpoint != null ? _servicesOptions.GetTimeout(endpoint) : _legacyOptions.TimeoutSeconds;
            cts.CancelAfter(TimeSpan.FromSeconds(timeout));

            var resp = await _http.SendAsync(request, cts.Token);
            if (!resp.IsSuccessStatusCode)
            {
                var err = await resp.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Motion engine {Engine} returned {Status}: {Error}", engine, resp.StatusCode, err);
                _breaker.RecordFailure(circuitKey);
                return ErrorResult(engine, prompt, durationSec, sw.Elapsed.TotalSeconds, $"HTTP {(int)resp.StatusCode}: {err}");
            }

            var raw = await resp.Content.ReadFromJsonAsync<MotionApiResponse>(ct);
            if (raw == null)
            {
                _breaker.RecordFailure(circuitKey);
                return ErrorResult(engine, prompt, durationSec, sw.Elapsed.TotalSeconds, "Empty response");
            }

            _breaker.RecordSuccess(circuitKey);
            var frames = MapFrames(raw);
            return new MotionGenerationResult(
                Engine: engine,
                Prompt: prompt,
                DurationSec: raw.DurationSec ?? durationSec,
                Fps: raw.Fps ?? fps,
                TotalFrames: frames.Count,
                JointCount: frames.Count > 0 ? frames[0].Joints.Count : 0,
                Frames: frames,
                BvhData: raw.Bvh,
                GenerationTimeSec: sw.Elapsed.TotalSeconds,
                Error: null
            );
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "Motion engine {Engine} unavailable", engine);
            _breaker.RecordFailure(circuitKey);
            return ErrorResult(engine, prompt, durationSec, sw.Elapsed.TotalSeconds, ex.Message);
        }
    }

    public async Task<MotionComparisonResult> CompareAsync(string prompt, double durationSec = 4.0, double fps = 20.0, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();

        var enabledEngines = GetEnabledEngines();
        var tasks = enabledEngines.Select(engine => GenerateAsync(prompt, engine, durationSec, fps, ct));
        var results = await Task.WhenAll(tasks);

        return new MotionComparisonResult(
            Prompt: prompt,
            RequestedDurationSec: durationSec,
            Results: results.Where(r => r != null).Cast<MotionGenerationResult>().ToList(),
            TotalTimeSec: sw.Elapsed.TotalSeconds
        );
    }

    public async Task<byte[]?> GenerateBvhAsync(string prompt, string engine, double durationSec = 4.0, CancellationToken ct = default)
    {
        var (baseUrl, endpoint) = ResolveEndpoint(engine);
        if (baseUrl == null || (endpoint != null && !endpoint.Enabled)) return null;

        var circuitKey = $"motion:{engine}";
        if (endpoint != null && _breaker.IsOpen(circuitKey, endpoint.CircuitBreakerThreshold, endpoint.CircuitBreakerCooldownSeconds))
            return null;

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/generate/bvh");
            if (!string.IsNullOrEmpty(endpoint?.ApiKey))
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", endpoint.ApiKey);
            request.Content = JsonContent.Create(new { prompt, duration_sec = durationSec, format = "bvh" });

            var resp = await _http.SendAsync(request, ct);
            if (!resp.IsSuccessStatusCode)
            {
                _breaker.RecordFailure(circuitKey);
                return null;
            }

            _breaker.RecordSuccess(circuitKey);
            return await resp.Content.ReadAsByteArrayAsync(ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "Motion engine {Engine} BVH generation failed", engine);
            _breaker.RecordFailure(circuitKey);
            return null;
        }
    }

    public async Task<IReadOnlyDictionary<string, bool>> HealthCheckAsync(CancellationToken ct = default)
    {
        var engines = GetEnabledEngines();
        var tasks = engines.Select(async engine =>
        {
            var (baseUrl, endpoint) = ResolveEndpoint(engine);
            if (baseUrl == null || (endpoint != null && !endpoint.Enabled))
                return (engine, false);
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                cts.CancelAfter(TimeSpan.FromSeconds(5));
                var resp = await _http.GetAsync($"{baseUrl}/health", cts.Token);
                return (engine, resp.IsSuccessStatusCode);
            }
            catch
            {
                return (engine, false);
            }
        });

        var results = await Task.WhenAll(tasks);
        return results.ToDictionary(r => r.engine, r => r.Item2);
    }

    private (string? url, AiServiceEndpoint? endpoint) ResolveEndpoint(string engine)
    {
        var key = engine.ToLowerInvariant();

        // Try centralized AiServices:Motion config first
        if (_servicesOptions.Motion.TryGetValue(key, out var ep) && !string.IsNullOrEmpty(ep.Url))
            return (ep.Url.TrimEnd('/'), ep);

        // Fall back to legacy AiMotion config
        var legacyUrl = key switch
        {
            "motiongpt" => _legacyOptions.MotionGptUrl,
            "mdm" => _legacyOptions.MdmUrl,
            "momask" => _legacyOptions.MoMaskUrl,
            _ => null
        };

        return (legacyUrl, null);
    }

    private string[] GetEnabledEngines()
    {
        if (_servicesOptions.Motion.Count > 0)
            return _servicesOptions.Motion
                .Where(kvp => kvp.Value.Enabled && !string.IsNullOrEmpty(kvp.Value.Url))
                .Select(kvp => kvp.Key)
                .ToArray();

        return AllEngines;
    }

    private static List<MotionFrame> MapFrames(MotionApiResponse raw)
    {
        if (raw.Frames == null || raw.Frames.Count == 0) return [];

        var fps = raw.Fps ?? 20.0;
        return raw.Frames.Select((f, i) => new MotionFrame(
            FrameIndex: i,
            TimestampSec: i / fps,
            Joints: f.Joints?.Select(j => new MotionJoint(j.Name, j.X, j.Y, j.Z)).ToList()
                   ?? (IReadOnlyList<MotionJoint>)[]
        )).ToList();
    }

    private static MotionGenerationResult ErrorResult(string engine, string prompt, double duration, double elapsed, string error)
        => new(engine, prompt, duration, 0, 0, 0, [], null, elapsed, error);

    // ── Internal DTOs matching Python sidecar JSON ──

    private sealed record MotionApiResponse(
        double? DurationSec,
        double? Fps,
        string? Bvh,
        List<MotionApiFrame>? Frames
    );

    private sealed record MotionApiFrame(List<MotionApiJoint>? Joints);

    private sealed record MotionApiJoint(string Name, double X, double Y, double Z);
}
