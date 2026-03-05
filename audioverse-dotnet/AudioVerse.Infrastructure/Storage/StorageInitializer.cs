using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Storage;

public static class StorageInitializer
{
    public static async Task EnsureBucketsAsync(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var provider = scope.ServiceProvider;
        var config = provider.GetRequiredService<IConfiguration>();
        var storage = provider.GetRequiredService<IFileStorage>();
        var logger = provider.GetService<ILoggerFactory>()?.CreateLogger("StorageInitializer");

        var buckets = config.GetSection("Storage:Buckets").Get<string[]>() ?? Array.Empty<string>();
        foreach (var bucket in buckets)
        {
            try
            {
                logger?.LogInformation("Ensuring bucket exists: {Bucket}", bucket);
                await storage.EnsureBucketExistsAsync(bucket, cancellationToken);
                logger?.LogInformation("Bucket ensured: {Bucket}", bucket);
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "Failed to ensure bucket {Bucket}", bucket);
            }
        }

        // Apply public bucket policies if configured
        var publicBuckets = config.GetSection("StorageOptions:PublicBuckets").Get<string[]>() ?? Array.Empty<string>();
        foreach (var pb in publicBuckets)
        {
            try
            {
                logger?.LogInformation("Setting bucket public: {Bucket}", pb);
                await storage.SetBucketPublicAsync(pb, cancellationToken);
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Failed to set public policy for bucket {Bucket}", pb);
            }
        }
    }
}
