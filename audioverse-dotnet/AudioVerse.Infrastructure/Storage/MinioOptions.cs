namespace AudioVerse.Infrastructure.Storage;

public class MinioOptions
{
    public string? ServiceUrl { get; set; }
    public string? AccessKey { get; set; }
    public string? SecretKey { get; set; }
    public int BucketCreationRetryAttempts { get; set; } = 3;
    public int BucketCreationInitialDelayMs { get; set; } = 500;
    public int UploadRetryAttempts { get; set; } = 3;
    public int UploadRetryInitialDelayMs { get; set; } = 200;
    public int UploadTimeoutMs { get; set; } = 30000; // 30s
}
