namespace AudioVerse.SetupWizard;

public class SetupConfig
{
    public string? Domain { get; set; }
    public string? Email { get; set; }
    public string? CertFullchainPath { get; set; }
    public string? CertKeyPath { get; set; }
    public int RetryAttempts { get; set; } = 3;
    public int RetryDelaySeconds { get; set; } = 10;
    public string? PostgresUser { get; set; }
    public string? PostgresPassword { get; set; }
    public string? MinioUser { get; set; }
    public string? MinioPassword { get; set; }
    public string? RedisPassword { get; set; }
    public string? JwtSecret { get; set; }
    public bool UseDockerSecrets { get; set; }
}
