namespace AudioVerse.Application.Services.Security;

public interface IRecaptchaService
{
    Task<RecaptchaVerificationResult> VerifyTokenAsync(string token);
}
