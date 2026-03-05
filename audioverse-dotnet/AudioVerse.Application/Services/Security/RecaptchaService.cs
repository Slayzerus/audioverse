using Microsoft.Extensions.Configuration;

namespace AudioVerse.Application.Services.Security
{
    public class RecaptchaService : IRecaptchaService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private const string VerificationUrl = "https://www.google.com/recaptcha/api/siteverify";

        public RecaptchaService(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        public async Task<RecaptchaVerificationResult> VerifyTokenAsync(string token)
        {
            if (string.IsNullOrEmpty(token))
            {
                return new RecaptchaVerificationResult
                {
                    Success = false,
                    ErrorCodes = new List<string> { "missing-token" }
                };
            }

            try
            {
                var secretKey = _configuration["RecaptchaSettings:SecretKey"];
                if (string.IsNullOrEmpty(secretKey))
                {
                    throw new InvalidOperationException("RecaptchaSettings:SecretKey not configured");
                }

                using (var client = _httpClientFactory.CreateClient())
                {
                    var content = new FormUrlEncodedContent(new[]
                    {
                        new KeyValuePair<string, string>("secret", secretKey),
                        new KeyValuePair<string, string>("response", token)
                    });

                    var response = await client.PostAsync(VerificationUrl, content);
                    response.EnsureSuccessStatusCode();

                    var jsonContent = await response.Content.ReadAsStringAsync();
                    var result = System.Text.Json.JsonSerializer.Deserialize<RecaptchaApiResponse>(jsonContent);

                    if (result == null)
                    {
                        return new RecaptchaVerificationResult
                        {
                            Success = false,
                            ErrorCodes = new List<string> { "invalid-response" }
                        };
                    }

                    return new RecaptchaVerificationResult
                    {
                        Success = result.success,
                        Score = result.score,
                        Action = result.action,
                        ChallengeTs = result.challenge_ts,
                        Hostname = result.hostname,
                        ErrorCodes = result.error_codes ?? new List<string>()
                    };
                }
            }
            catch (Exception ex)
            {
                return new RecaptchaVerificationResult
                {
                    Success = false,
                    ErrorCodes = new List<string> { $"verification-error: {ex.Message}" }
                };
            }
        }
    }

    // Google API response model
    internal class RecaptchaApiResponse
    {
        public bool success { get; set; }
        public float score { get; set; }
        public string? action { get; set; }
        public string? challenge_ts { get; set; }
        public string? hostname { get; set; }
        public List<string>? error_codes { get; set; }
    }
}
