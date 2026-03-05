using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using AudioVerse.Tests.Integration;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    /// <summary>
    /// Integration tests for HoneyToken and Captcha endpoints.
    /// </summary>
    public class HoneyTokenCaptchaIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        private const string JwtSecret = "integration-test-secret-key-1234567890";

        public HoneyTokenCaptchaIntegrationTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>
        /// Verifies HoneyToken creation and retrieval of triggered tokens.
        /// </summary>
        [Fact]
        public async Task HoneyToken_Create_And_GetTriggered()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", GenerateAdminToken());

            var createResponse = await client.PostAsJsonAsync("/api/user/honeytokens/create", new { type = "HTTP", description = "integration-test" });
            createResponse.EnsureSuccessStatusCode();
            var created = await createResponse.Content.ReadFromJsonAsync<CreateHoneyTokenResponse>();
            Assert.NotNull(created);
            Assert.True(created.Success);
            Assert.NotEqual(0, created.Token.Id);
            Assert.False(string.IsNullOrEmpty(created.Token.TokenId));

            var triggeredResponse = await client.GetAsync("/api/user/honeytokens/triggered");
            triggeredResponse.EnsureSuccessStatusCode();
            var triggered = await triggeredResponse.Content.ReadFromJsonAsync<TriggeredTokensResponse>();
            Assert.NotNull(triggered);
            Assert.True(triggered.Success);
        }

        /// <summary>
        /// Validates captcha success and failure scenarios for generated captcha type 1.
        /// </summary>
        [Fact]
        public async Task Captcha_Generate_Validate_Success_And_Fail()
        {
            var client = _factory.CreateClient();

            var generateResponse = await client.PostAsync("/api/user/captcha/generate?captchaType=1", null);
            generateResponse.EnsureSuccessStatusCode();
            var generate = await generateResponse.Content.ReadFromJsonAsync<CaptchaGenerateResponse>();
            Assert.NotNull(generate);
            Assert.True(generate.Success);
            Assert.True(generate.CaptchaId > 0);
            Assert.False(string.IsNullOrEmpty(generate.Challenge));

            var expectedAnswer = MapAnswer(generate.Challenge!);
            Assert.False(string.IsNullOrEmpty(expectedAnswer));

            var validateOk = await client.PostAsJsonAsync("/api/user/captcha/validate", new { captchaId = generate.CaptchaId, answer = expectedAnswer });
            validateOk.EnsureSuccessStatusCode();
            var validateOkResult = await validateOk.Content.ReadFromJsonAsync<ValidateCaptchaResponse>();
            Assert.NotNull(validateOkResult);
            Assert.True(validateOkResult.Success);

            var validateBad = await client.PostAsJsonAsync("/api/user/captcha/validate", new { captchaId = generate.CaptchaId, answer = "zla_odpowiedz" });
            validateBad.EnsureSuccessStatusCode();
            var validateBadResult = await validateBad.Content.ReadFromJsonAsync<ValidateCaptchaResponse>();
            Assert.NotNull(validateBadResult);
            Assert.False(validateBadResult.Success);
        }

        private static string GenerateAdminToken()
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(JwtSecret);
            var descriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", "1"),
                    new Claim("username", "admin"),
                    new Claim(ClaimTypes.Role, "Admin")
                }),
                Expires = DateTime.UtcNow.AddHours(1),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(descriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Maps known captcha challenges to expected lowercase answers.
        /// </summary>
        private static string MapAnswer(string challenge)
        {
            return challenge switch
            {
                "Co jest stolic? Wielkiej Brytanii?" => "londyn",
                "Jaka jest stolic? Polski?" => "warszawa",
                "Co jest stolic? Francji?" => "pary?",
                "Jaka jest najwi?ksza planeta w Uk?adzie S?onecznym?" => "jowisz",
                "Ile wynosi 5 + 3?" => "8",
                "Jaki jest kolor trawy?" => "zielony",
                "Ile boków ma sze?ciok?t?" => "6",
                "Czy woda musi by? gor?ca aby gotowa??" => "tak",
                "Ile nóg ma ptak?" => "2",
                "Jakie jest przeciwie?stwo bieli?" => "czarny",
                _ => string.Empty
            };
        }

        /// <summary>
        /// DTO for honey token creation response.
        /// </summary>
        private class CreateHoneyTokenResponse
        {
            public bool Success { get; set; }
            public TokenDto Token { get; set; } = new();
        }

        /// <summary>
        /// DTO representing a honey token.
        /// </summary>
        private class TokenDto
        {
            public int Id { get; set; }
            public string TokenId { get; set; } = string.Empty;
            public string Type { get; set; } = string.Empty;
        }

        /// <summary>
        /// DTO for triggered tokens list response.
        /// </summary>
        private class TriggeredTokensResponse
        {
            public bool Success { get; set; }
            public List<object>? Tokens { get; set; }
        }

        /// <summary>
        /// DTO for captcha generation response.
        /// </summary>
        private class CaptchaGenerateResponse
        {
            public bool Success { get; set; }
            public int CaptchaId { get; set; }
            public string? Challenge { get; set; }
        }

        /// <summary>
        /// DTO for captcha validation response.
        /// </summary>
        private class ValidateCaptchaResponse
        {
            public bool Success { get; set; }
        }
    }
}
