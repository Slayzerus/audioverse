using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Collections.Generic;

namespace AudioVerse.Infrastructure.Storage;

public class PresignedUrlBackgroundCache : IPresignedUrlCache, IHostedService, IDisposable
{
    private readonly IMemoryCache _cache;
    private readonly IFileStorage _storage;
    private readonly ILogger<PresignedUrlBackgroundCache> _logger;
    private readonly IConfiguration _config;
    private readonly Dictionary<string, System.Threading.Timer> _timers = new();
    private readonly LinkedList<string> _lru = new();
    private readonly object _lock = new();
    private readonly int _capacity;
    private readonly int _refreshRetryAttempts;

    public PresignedUrlBackgroundCache(IMemoryCache cache, IFileStorage storage, ILogger<PresignedUrlBackgroundCache> logger, IConfiguration config)
    {
        _cache = cache;
        _storage = storage;
        _logger = logger;
        _config = config;

        _capacity = int.TryParse(_config["StorageOptions:PresignedCache:Capacity"], out var c) ? c : 500;
        _refreshRetryAttempts = int.TryParse(_config["StorageOptions:PresignedCache:RefreshRetryAttempts"], out var r) ? r : 3;
    }

    public Task<string> GetOrAddAsync(string key, Func<Task<string>> factory, TimeSpan ttl)
    {
        if (_cache.TryGetValue<string>(key, out var val) && val is not null)
        {
            // update LRU position
            lock (_lock)
            {
                if (_lru.Contains(key)) { _lru.Remove(key); _lru.AddLast(key); }
            }
            return Task.FromResult(val);
        }

        // enforce capacity
        lock (_lock)
        {
            if (_lru.Count >= _capacity)
            {
                var oldest = _lru.First?.Value;
                if (oldest != null)
                {
                    _lru.RemoveFirst();
                    try { _cache.Remove(oldest); } catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException) { }
                    if (_timers.TryGetValue(oldest, out var ot)) { ot.Dispose(); _timers.Remove(oldest); }
                }
            }
        }

        var url = factory().GetAwaiter().GetResult();

        var options = new MemoryCacheEntryOptions
        {
            SlidingExpiration = ttl
        };

        options.RegisterPostEvictionCallback((k, v, reason, state) =>
        {
            try
            {
                var sk = (string)k!;
                lock (_lock)
                {
                    if (_timers.TryGetValue(sk, out var t))
                    {
                        t.Dispose();
                        _timers.Remove(sk);
                    }
                    _lru.Remove(sk);
                }
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException) { }
        });

        _cache.Set(key, url, options);

        lock (_lock)
        {
            _lru.AddLast(key);
        }

        // schedule refresh refreshBeforeExpiry (default 60s before expiration)
        var refreshBeforeSec = int.TryParse(_config["StorageOptions:PresignedCache:RefreshBeforeExpirySeconds"], out var rb) ? rb : 60;
        var refreshMs = Math.Max(1000, (int)ttl.TotalMilliseconds - (refreshBeforeSec * 1000));

        var timer = new System.Threading.Timer(async _ =>
        {
            int attempt = 0;
            int delay = 500;
            while (attempt < _refreshRetryAttempts)
            {
                try
                {
                    var newUrl = await factory();
                    var newOptions = new MemoryCacheEntryOptions { SlidingExpiration = ttl };
                    newOptions.RegisterPostEvictionCallback((k, v, reason, state) =>
                    {
                        try
                        {
                            var sk = (string)k!;
                            lock (_lock)
                            {
                                if (_timers.TryGetValue(sk, out var t)) { t.Dispose(); _timers.Remove(sk); }
                                _lru.Remove(sk);
                            }
                        }
                        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or InvalidOperationException) { }
                    });
                    _cache.Set(key, newUrl, newOptions);
                    break;
                }
                catch (Exception ex)
                {
                    attempt++;
                    _logger.LogWarning(ex, "Refresh attempt {Attempt} for presigned url {Key} failed", attempt, key);
                    if (attempt >= _refreshRetryAttempts) break;
                    try { await Task.Delay(delay); } catch (TaskCanceledException) { }
                    delay *= 2;
                }
            }
        }, null, refreshMs, refreshMs);

        lock (_lock)
        {
            _timers[key] = timer;
        }

        return Task.FromResult(url);
    }

    public Task StartAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    public Task StopAsync(CancellationToken cancellationToken)
    {
        lock (_lock)
        {
            foreach (var t in _timers.Values) t.Dispose();
            _timers.Clear();
            _lru.Clear();
        }
        return Task.CompletedTask;
    }

    public void Dispose()
    {
        lock (_lock)
        {
            foreach (var t in _timers.Values) t.Dispose();
            _timers.Clear();
            _lru.Clear();
        }
    }
}
