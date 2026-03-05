namespace AudioVerse.SetupWizard;

public class DeploymentSecrets
{
    public string PostgresUser { get; set; } = "audioverse";
    public string PostgresPassword { get; set; } = string.Empty;
    public string MinioUser { get; set; } = "minioadmin";
    public string MinioPassword { get; set; } = string.Empty;
    public string RedisPassword { get; set; } = string.Empty;
    public string JwtSecret { get; set; } = string.Empty;
}
