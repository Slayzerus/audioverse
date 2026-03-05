namespace AudioVerse.Infrastructure.RateLimiting;

public interface IRateLimiter
{
    /// <summary>
    /// Try to acquire a token for given client id. Returns true if allowed.
    /// </summary>
    Task<bool> TryAcquireAsync(string clientId);
}
