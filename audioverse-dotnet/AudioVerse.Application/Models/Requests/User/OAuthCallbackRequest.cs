namespace AudioVerse.API.Areas.Identity.Controllers;

public class OAuthCallbackRequest
{
    public string? Code { get; set; }
    public string? AccessToken { get; set; }
    public string? RedirectUri { get; set; }
    public string? State { get; set; }
}
