namespace AudioVerse.API.Areas.Identity.Controllers;

public class ExternalConnectionDto
{
    public string Platform { get; set; } = string.Empty;
    public string ExternalUserId { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Email { get; set; }
    public string? AvatarUrl { get; set; }
    public DateTime LinkedAt { get; set; }
    public DateTime? LastUsedAt { get; set; }
    public bool IsExpired { get; set; }
    public string? Scopes { get; set; }
}
