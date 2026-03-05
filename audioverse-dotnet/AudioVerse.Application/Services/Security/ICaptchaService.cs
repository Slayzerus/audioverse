using AudioVerse.Domain.Entities.Auth;

namespace AudioVerse.Application.Services.Security;

public interface ICaptchaService
{
    Task<Captcha> GenerateCaptchaAsync(int captchaType, string? ipAddress = null);
    Task<bool> ValidateCaptchaAsync(int captchaId, string userAnswer);
    Task<Captcha?> GetCaptchaAsync(int captchaId);
}
