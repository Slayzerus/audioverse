using StackExchange.Redis;

namespace AudioVerse.Infrastructure.RateLimiting;

public class RedisRateLimiter : IRateLimiter
{
    private readonly IDatabase _db;
    private readonly int _limit;
    private readonly TimeSpan _window;

    public RedisRateLimiter(IConnectionMultiplexer redis, int limit = 10, TimeSpan? window = null)
    {
        _db = redis.GetDatabase();
        _limit = limit;
        _window = window ?? TimeSpan.FromMinutes(1);
    }

    public async Task<bool> TryAcquireAsync(string clientId)
    {
        var key = $"ratelimit:{clientId}";
        // use INCR and set expiry when newly created
        var val = await _db.StringIncrementAsync(key);
        if (val == 1)
        {
            await _db.KeyExpireAsync(key, _window);
        }
        return val <= _limit;
    }
}
