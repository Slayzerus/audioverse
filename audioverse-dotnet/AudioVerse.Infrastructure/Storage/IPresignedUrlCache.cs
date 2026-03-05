namespace AudioVerse.Infrastructure.Storage;

/// <summary>Cache for S3/MinIO presigned URLs to avoid repeated generation.</summary>
public interface IPresignedUrlCache
{
    Task<string> GetOrAddAsync(string key, Func<Task<string>> factory, TimeSpan ttl);
}
