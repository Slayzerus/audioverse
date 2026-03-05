namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>Request zawierający kod TOTP do weryfikacji.</summary>
public class TotpCodeRequest
{
    public string Code { get; set; } = string.Empty;
}
