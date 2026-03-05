using System.Collections.Concurrent;

namespace AudioVerse.Infrastructure.RateLimiting;

public class InMemoryRateLimiter : IRateLimiter
{
    private readonly ConcurrentDictionary<string, (int Count, DateTime WindowStart)> _store = new();
    private readonly int _limit;
    private readonly TimeSpan _window;

    public InMemoryRateLimiter(int limit = 10, TimeSpan? window = null)
    {
        _limit = limit;
        _window = window ?? TimeSpan.FromMinutes(1);
    }

    public Task<bool> TryAcquireAsync(string clientId)
    {
        var now = DateTime.UtcNow;
        _store.AddOrUpdate(clientId, (1, now), (k, v) =>
        {
            if (now - v.WindowStart > _window) return (1, now);
            return (v.Count + 1, v.WindowStart);
        });

        var cur = _store[clientId];
        return Task.FromResult(cur.Count <= _limit);
    }
}
