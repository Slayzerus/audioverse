namespace AudioVerse.API.Areas.Identity.Controllers;

public class CreateHoneyTokenRequest
{
    public string Type { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}
