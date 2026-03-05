namespace AudioVerse.API.Areas.Admin.Controllers;

public class CreateSkinThemeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDark { get; set; }
    public string? BodyBackground { get; set; }
    public Dictionary<string, string> Vars { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public bool IsSystem { get; set; }
    public int SortOrder { get; set; }
}
