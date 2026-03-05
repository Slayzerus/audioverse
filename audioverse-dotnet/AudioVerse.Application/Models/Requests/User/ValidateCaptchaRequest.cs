namespace AudioVerse.API.Areas.Identity.Controllers;

public class ValidateCaptchaRequest
{
    public int CaptchaId { get; set; }
    public string Answer { get; set; } = string.Empty;
}
