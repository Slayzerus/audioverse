using AudioVerse.Application.Services.Security;

namespace AudioVerse.Tests.Integration
{
    /// <summary>
    /// Fake implementation of reCAPTCHA service returning successful verification for tests.
    /// </summary>
    public class FakeRecaptchaService : IRecaptchaService
    {
        /// <inheritdoc />
        public Task<RecaptchaVerificationResult> VerifyTokenAsync(string token)
        {
            return Task.FromResult(new RecaptchaVerificationResult
            {
                Success = true,
                Score = 0.9f,
                Action = "test",
                ErrorCodes = new List<string>()
            });
        }
    }
}
