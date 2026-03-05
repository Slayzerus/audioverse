using System.Collections.Concurrent;

namespace AudioVerse.Infrastructure.Telemetry;

public class InMemoryUploadMetrics : IUploadMetrics
{
    private readonly ConcurrentDictionary<string, int> _counts = new();

    public void IncrementFailure(string reason)
    {
        _counts.AddOrUpdate(reason ?? "unknown", 1, (_, v) => v + 1);
    }

    public IReadOnlyDictionary<string, int> GetAll() => _counts;
}
