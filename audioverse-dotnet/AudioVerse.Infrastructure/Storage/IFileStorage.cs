namespace AudioVerse.Infrastructure.Storage;

public interface IFileStorage
{
    // Upload a stream to the specified bucket and key
    Task UploadAsync(string bucket, string key, Stream data, string contentType, CancellationToken cancellationToken = default);

    // Download a stream from the specified bucket and key
    Task<Stream?> DownloadAsync(string bucket, string key, CancellationToken cancellationToken = default);

    // Ensure bucket exists
    Task EnsureBucketExistsAsync(string bucket, CancellationToken cancellationToken = default);

    // Generate presigned URL for an object (valid for provided duration)
    Task<string> GetPresignedUrlAsync(string bucket, string key, TimeSpan validFor);

    // Delete object from bucket
    Task DeleteAsync(string bucket, string key, CancellationToken cancellationToken = default);

    // Get direct public URL for object (if available)
    string GetPublicUrl(string bucket, string key);

    // Make a bucket public (set policy)
    Task SetBucketPublicAsync(string bucket, CancellationToken cancellationToken = default);
    // Remove public policy / make bucket private
    Task SetBucketPrivateAsync(string bucket, CancellationToken cancellationToken = default);
    // Check whether a bucket is public (returns true if readable anonymously)
    Task<bool> IsBucketPublicAsync(string bucket, CancellationToken cancellationToken = default);
    // List buckets available in the storage
    Task<IEnumerable<string>> ListBucketsAsync(CancellationToken cancellationToken = default);
}
