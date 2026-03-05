namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>Request weryfikacji TOTP dla danego użytkownika.</summary>
public class TotpVerifyRequest
{
    public int UserId { get; set; }
    public string Code { get; set; } = string.Empty;
}
