namespace AudioVerse.API.Areas.Identity.Controllers;

public class TotpVerifyRequest
{
    public int UserId { get; set; }
    public string Code { get; set; } = string.Empty;
}
