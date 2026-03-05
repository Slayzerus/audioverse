using System.Collections.Concurrent;

namespace AudioVerse.Application.Services.Utils;

/// <summary>
/// Lightweight circuit breaker for AI service endpoints.
/// Tracks consecutive failures per endpoint and opens the circuit
/// (stops calling) when threshold is reached.
/// </summary>
public class AiCircuitBreaker
{
    private readonly ConcurrentDictionary<string, CircuitState> _states = new();

    /// <summary>Check if the circuit for an endpoint is open (should not call).</summary>
    public bool IsOpen(string endpointKey, int threshold, int cooldownSeconds)
    {
        if (threshold <= 0) return false;
        if (!_states.TryGetValue(endpointKey, out var state)) return false;

        if (state.ConsecutiveFailures < threshold) return false;

        // Circuit is open — check if cooldown has passed
        if (state.LastFailureUtc.AddSeconds(cooldownSeconds) < DateTime.UtcNow)
        {
            // Allow one probe request (half-open)
            state.IsProbing = true;
            return false;
        }

        return true;
    }

    /// <summary>Record a successful call — resets the circuit.</summary>
    public void RecordSuccess(string endpointKey)
    {
        _states.AddOrUpdate(endpointKey,
            _ => new CircuitState(),
            (_, existing) =>
            {
                existing.ConsecutiveFailures = 0;
                existing.IsProbing = false;
                return existing;
            });
    }

    /// <summary>Record a failed call — increments failure counter.</summary>
    public void RecordFailure(string endpointKey)
    {
        _states.AddOrUpdate(endpointKey,
            _ => new CircuitState { ConsecutiveFailures = 1, LastFailureUtc = DateTime.UtcNow },
            (_, existing) =>
            {
                existing.ConsecutiveFailures++;
                existing.LastFailureUtc = DateTime.UtcNow;
                existing.IsProbing = false;
                return existing;
            });
    }

    /// <summary>Get current status snapshot for all tracked endpoints.</summary>
    public IReadOnlyDictionary<string, CircuitStatus> GetSnapshot()
    {
        return _states.ToDictionary(
            kvp => kvp.Key,
            kvp => new CircuitStatus(
                kvp.Value.ConsecutiveFailures,
                kvp.Value.LastFailureUtc,
                kvp.Value.IsProbing));
    }

    private class CircuitState
    {
        public int ConsecutiveFailures;
        public DateTime LastFailureUtc = DateTime.MinValue;
        public bool IsProbing;
    }
}
