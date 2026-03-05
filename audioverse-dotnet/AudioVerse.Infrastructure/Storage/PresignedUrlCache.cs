using Microsoft.Extensions.Caching.Memory;

namespace AudioVerse.Infrastructure.Storage;

/// <summary>In-memory presigned URL cache using IMemoryCache.</summary>
public class PresignedUrlCache : IPresignedUrlCache
{
    private readonly IMemoryCache _cache;

    public PresignedUrlCache(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<string> GetOrAddAsync(string key, Func<Task<string>> factory, TimeSpan ttl)
    {
        if (_cache.TryGetValue<string>(key, out var val) && val is not null)
            return Task.FromResult(val);

        var url = factory().GetAwaiter().GetResult();
        _cache.Set(key, url, ttl);
        return Task.FromResult(url);
    }
}
