using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Util;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace AudioVerse.Infrastructure.Storage;

public class S3FileStorage : IFileStorage, IAsyncDisposable
{
    private readonly IAmazonS3 _s3;
    private readonly MinioOptions _options;
    private readonly Microsoft.Extensions.Logging.ILogger _logger;

    public S3FileStorage(IOptions<MinioOptions> options, ILoggerFactory loggerFactory)
    {
        _options = options.Value;
        _logger = loggerFactory.CreateLogger(typeof(S3FileStorage).FullName ?? "S3FileStorage");
        var config = new AmazonS3Config
        {
            ServiceURL = _options.ServiceUrl,
            ForcePathStyle = true // important for MinIO
        };

        _s3 = new AmazonS3Client(_options.AccessKey, _options.SecretKey, config);
    }

    public async Task<IEnumerable<string>> ListBucketsAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            var resp = await _s3.ListBucketsAsync(cancellationToken);
            return resp.Buckets.Select(b => b.BucketName).ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to list buckets");
            return Array.Empty<string>();
        }
    }

    // helper to classify exception reason for metrics
    public static string ClassifyUploadException(Exception ex)
    {
        if (ex is OperationCanceledException || ex is TaskCanceledException) return "timeout";
        if (ex is AmazonS3Exception s3ex)
        {
            var code = (int)s3ex.StatusCode;
            if (string.Equals(s3ex.ErrorCode, "SlowDown", StringComparison.OrdinalIgnoreCase) || code == 503) return "throttling";
            if (code >= 500) return "s3_server_error";
            if (code == 404) return "not_found";
            return "s3_error";
        }
        if (ex is System.Net.Http.HttpRequestException) return "network";
        if (ex is InvalidOperationException) return "invalid_operation";
        return "unknown";
    }

    public async Task<bool> IsBucketPublicAsync(string bucket, CancellationToken cancellationToken = default)
    {
        // First try bucket policy (works for AWS and MinIO)
        try
        {
            var policyResp = await _s3.GetBucketPolicyAsync(new GetBucketPolicyRequest { BucketName = bucket }, cancellationToken);
            var policyJson = policyResp.Policy;
            if (!string.IsNullOrEmpty(policyJson))
            {
                try
                {
                    using var doc = System.Text.Json.JsonDocument.Parse(policyJson);
                    if (doc.RootElement.TryGetProperty("Statement", out var stmts))
                    {
                        foreach (var stmt in stmts.EnumerateArray())
                        {
                            var effect = stmt.GetProperty("Effect").GetString();
                            if (!string.Equals(effect, "Allow", StringComparison.OrdinalIgnoreCase)) continue;
                            // principal check
                            if (stmt.TryGetProperty("Principal", out var principal))
                            {
                                if (principal.ValueKind == System.Text.Json.JsonValueKind.String && principal.GetString() == "*")
                                {
                                    // wildcard principal
                                }
                            }
                            // Action
                            if (stmt.TryGetProperty("Action", out var action))
                            {
                                bool allowsGetObject = false;
                                if (action.ValueKind == System.Text.Json.JsonValueKind.String)
                                {
                                    var a = action.GetString();
                                    if (a == "s3:GetObject" || a == "s3:*" || a == "*") allowsGetObject = true;
                                }
                                else if (action.ValueKind == System.Text.Json.JsonValueKind.Array)
                                {
                                    foreach (var a in action.EnumerateArray())
                                    {
                                        var av = a.GetString();
                                        if (av == "s3:GetObject" || av == "s3:*" || av == "*") { allowsGetObject = true; break; }
                                    }
                                }
                                if (!allowsGetObject) continue;
                            }

                            // Resource
                            if (stmt.TryGetProperty("Resource", out var resource))
                            {
                                if (resource.ValueKind == System.Text.Json.JsonValueKind.String)
                                {
                                    var r = resource.GetString();
                                    if (!string.IsNullOrEmpty(r) && r.Contains($":{bucket}/")) return true;
                                }
                                else if (resource.ValueKind == System.Text.Json.JsonValueKind.Array)
                                {
                                    foreach (var r in resource.EnumerateArray())
                                    {
                                        var rv = r.GetString();
                                        if (!string.IsNullOrEmpty(rv) && rv.Contains($":{bucket}/")) return true;
                                    }
                                }
                            }
                        }
                    }
                }
                catch (System.Text.Json.JsonException ex)
                {
                    _logger.LogDebug(ex, "Failed to parse bucket policy for {Bucket}", bucket);
                }
            }
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            // no policy
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to check bucket policy for {Bucket}", bucket);
        }

        // Fallback to ACL check
        try
        {
            #pragma warning disable CS0618 // Obsolete S3 ACL APIs — MinIO does not support separated operations
                        var acl = await _s3.GetACLAsync(new GetACLRequest { BucketName = bucket }, cancellationToken);
            #pragma warning restore CS0618
            foreach (var grant in acl.AccessControlList.Grants)
            {
                if (grant.Grantee.Type == "Group" && (grant.Grantee.URI?.EndsWith("AllUsers") ?? false) && (grant.Permission == S3Permission.READ || grant.Permission == S3Permission.FULL_CONTROL))
                {
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Failed to determine if bucket {Bucket} is public", bucket);
        }

        return false;
    }

    public async Task SetBucketPrivateAsync(string bucket, CancellationToken cancellationToken = default)
    {
        try
        {
            // remove bucket policy if present
            try
            {
                await _s3.DeleteBucketPolicyAsync(new DeleteBucketPolicyRequest { BucketName = bucket }, cancellationToken);
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // no policy, ignore
            }

            // set ACL to private
            try
            {
                var aclRequest = new PutACLRequest { BucketName = bucket, CannedACL = S3CannedACL.Private };
#pragma warning disable CS0618
                await _s3.PutACLAsync(aclRequest, cancellationToken);
#pragma warning restore CS0618
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to set bucket {Bucket} private", bucket);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to make bucket {Bucket} private", bucket);
        }
    }

    public async Task SetBucketPublicAsync(string bucket, CancellationToken cancellationToken = default)
    {
        try
        {
            // Try to set bucket policy to public-read using PutBucketPolicy
            var policy = GeneratePublicBucketPolicy(bucket);
            var putPolicyRequest = new PutBucketPolicyRequest
            {
                BucketName = bucket,
                Policy = policy
            };
            await _s3.PutBucketPolicyAsync(putPolicyRequest, cancellationToken);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotImplemented)
        {
            // fallback to ACL
            try
            {
                var aclRequest = new PutACLRequest { BucketName = bucket, CannedACL = S3CannedACL.PublicRead };
#pragma warning disable CS0618
                await _s3.PutACLAsync(aclRequest, cancellationToken);
#pragma warning restore CS0618
            }
            catch (Exception inner)
            {
                _logger.LogWarning(inner, "Fallback ACL set failed for bucket {Bucket}", bucket);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to set bucket {Bucket} public", bucket);
            // ignore
        }
    }

    private string GeneratePublicBucketPolicy(string bucket)
    {
        // Simple public read policy
        var policy = new
        {
            Version = "2012-10-17",
            Statement = new[] {
                new {
                    Sid = "PublicReadGetObject",
                    Effect = "Allow",
                    Principal = new { AWS = "*" },
                    Action = new[] { "s3:GetObject" },
                    Resource = new[] { $"arn:aws:s3:::{bucket}/*" }
                }
            }
        };
        return System.Text.Json.JsonSerializer.Serialize(policy);
    }

    public async Task DeleteAsync(string bucket, string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _s3.DeleteObjectAsync(new DeleteObjectRequest { BucketName = bucket, Key = key }, cancellationToken);
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            // already deleted
        }
    }

    public async Task UploadAsync(string bucket, string key, Stream data, string contentType, CancellationToken cancellationToken = default)
    {
        await EnsureBucketExistsAsync(bucket, cancellationToken);

        var maxAttempts = _options?.UploadRetryAttempts ?? 3;
        var delay = _options?.UploadRetryInitialDelayMs ?? 200;
        var timeoutMs = _options?.UploadTimeoutMs ?? 30000;

        // Read entire stream into byte[] once. The AWS SDK closes InputStream after
        // PutObjectAsync, so we must create a fresh MemoryStream for each attempt.
        byte[] payload;
        using (var tmp = new MemoryStream())
        {
            await data.CopyToAsync(tmp, cancellationToken);
            payload = tmp.ToArray();
        }

        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(timeoutMs);

                // Fresh stream per attempt — SDK will close it, that's fine.
                using var stream = new MemoryStream(payload, writable: false);
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucket,
                    Key = key,
                    InputStream = stream,
                    ContentType = contentType
                };

                var response = await _s3.PutObjectAsync(putRequest, cts.Token);
                var code = (int)response.HttpStatusCode;
                if (code >= 200 && code < 300)
                    return; // success

                if (code == 503)
                    throw new AmazonS3Exception("ServiceUnavailable") { StatusCode = System.Net.HttpStatusCode.ServiceUnavailable };
                throw new InvalidOperationException($"S3 upload failed with status {response.HttpStatusCode}");
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                _logger.LogWarning("Upload attempt {Attempt}/{Max} timed out for {Bucket}/{Key}", attempt, maxAttempts, bucket, key);
                if (attempt == maxAttempts) throw;
            }
            catch (OperationCanceledException)
            {
                throw; // caller cancelled
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Upload attempt {Attempt}/{Max} failed for {Bucket}/{Key}", attempt, maxAttempts, bucket, key);
                if (attempt == maxAttempts) throw;
            }

            await Task.Delay(delay, cancellationToken);
            delay *= 2;
        }
    }

    public async Task<Stream?> DownloadAsync(string bucket, string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var resp = await _s3.GetObjectAsync(bucket, key, cancellationToken);
            var mem = new MemoryStream();
            await resp.ResponseStream.CopyToAsync(mem, cancellationToken);
            mem.Position = 0;
            return mem;
        }
        catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task EnsureBucketExistsAsync(string bucket, CancellationToken cancellationToken = default)
    {
        // Retry logic with exponential backoff
        var maxAttempts = _options?.BucketCreationRetryAttempts ?? 3;
        var delay = _options?.BucketCreationInitialDelayMs ?? 500;
        for (int attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                if (!await AmazonS3Util.DoesS3BucketExistV2Async(_s3, bucket))
                {
                    await _s3.PutBucketAsync(new PutBucketRequest { BucketName = bucket }, cancellationToken);
                    _logger.LogInformation("Created bucket {Bucket}", bucket);
                }
                else
                {
                    _logger.LogDebug("Bucket {Bucket} already exists", bucket);
                }
                return;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Attempt {Attempt} to ensure bucket {Bucket} failed", attempt, bucket);
                if (attempt == maxAttempts)
                {
                    _logger.LogError(ex, "All {MaxAttempts} attempts to ensure bucket {Bucket} failed. Storage may be unavailable.", maxAttempts, bucket);
                    return;
                }
                await Task.Delay(delay, cancellationToken);
                delay *= 2;
            }
        }
    }

    public Task<string> GetPresignedUrlAsync(string bucket, string key, TimeSpan validFor)
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = bucket,
            Key = key,
            Expires = DateTime.UtcNow.Add(validFor)
        };

        var url = _s3.GetPreSignedURL(request);
        return Task.FromResult(url);
    }

    public string GetPublicUrl(string bucket, string key)
    {
        // If ServiceURL is configured, assume object path at {ServiceURL}/{bucket}/{key}
        if (!string.IsNullOrEmpty(_options.ServiceUrl))
        {
            return $"{_options.ServiceUrl.TrimEnd('/')}/{bucket}/{key}";
        }

        // fallback to presigned short lived URL
        return _s3.GetPreSignedURL(new GetPreSignedUrlRequest { BucketName = bucket, Key = key, Expires = DateTime.UtcNow.AddMinutes(5) });
    }

    public async ValueTask DisposeAsync()
    {
        if (_s3 is IDisposable d)
            d.Dispose();
        await Task.CompletedTask;
    }
}
