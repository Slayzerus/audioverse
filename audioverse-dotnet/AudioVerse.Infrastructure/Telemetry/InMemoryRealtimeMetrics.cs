using System.Collections.Concurrent;

namespace AudioVerse.Infrastructure.Telemetry;

public class InMemoryRealtimeMetrics : IRealtimeMetrics
{
    private readonly ConcurrentDictionary<string, int> _counts = new();

    public void IncrementPointsReceived(int count)
    {
        _counts.AddOrUpdate("points_received", count, (_, v) => v + count);
    }

    public void IncrementPacketsReceived()
    {
        _counts.AddOrUpdate("packets_received", 1, (_, v) => v + 1);
    }

    public void IncrementPacketsDropped(string reason)
    {
        _counts.AddOrUpdate($"packets_dropped:{reason}", 1, (_, v) => v + 1);
    }

    public IReadOnlyDictionary<string, int> GetAll() => _counts;
}
