namespace AudioVerse.API.Areas.Admin.Controllers;

public class UpdateSkinThemeRequest
{
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsDark { get; set; }
    public string? BodyBackground { get; set; }
    public Dictionary<string, string> Vars { get; set; } = new();
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
