namespace AudioVerse.API.Areas.Identity.Controllers;

/// <summary>Request walidacji odpowiedzi captcha.</summary>
public class ValidateCaptchaRequest
{
    public int CaptchaId { get; set; }
    public string Answer { get; set; } = string.Empty;
}
