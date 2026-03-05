namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>Request utworzenia honey tokena.</summary>
public class CreateHoneyTokenRequest
{
    public string Type { get; set; } = string.Empty; // "HTTP", "DNS", "Database", "Email"
    public string Description { get; set; } = string.Empty;
}
