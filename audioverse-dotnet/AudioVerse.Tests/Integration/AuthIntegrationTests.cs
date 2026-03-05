using System.Net.Http.Headers;
using System.Net.Http.Json;
using AudioVerse.Application.Commands.User;
using AudioVerse.Tests.Integration;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    /// <summary>
    /// Integration tests covering auth flows (register, login, refresh, logout) and recaptcha verification.
    /// </summary>
    public class AuthIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
/// <summary>
/// Integration tests for authentication flows.
/// </summary>

        public AuthIntegrationTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>
        /// Full happy-path flow: register -> login -> refresh -> logout.
        /// </summary>
        [Fact]
        public async Task Register_Login_Refresh_Logout_Flow_Works()
        {
            var client = _factory.CreateClient();
            var username = $"user_{Guid.NewGuid():N}";
            var password = "P@ssw0rd1!";

            // Register
            var registerResponse = await client.PostAsJsonAsync("/api/user/register", new RegisterUserCommand(username, $"{username}@test.com", password));
            registerResponse.EnsureSuccessStatusCode();

            // Login
            var loginResponse = await client.PostAsJsonAsync("/api/user/login", new LoginUserCommand(username, password));
            loginResponse.EnsureSuccessStatusCode();
            var loginContent = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
            Assert.NotNull(loginContent);
            Assert.True(loginContent.Success);
            Assert.False(string.IsNullOrEmpty(loginContent.TokenPair?.AccessToken));
            Assert.False(string.IsNullOrEmpty(loginContent.TokenPair?.RefreshToken));

            // Refresh
            var refreshResponse = await client.PostAsJsonAsync("/api/user/refresh-token", new RefreshRequest
            {
                AccessToken = loginContent.TokenPair!.AccessToken,
                RefreshToken = loginContent.TokenPair.RefreshToken
            });
            refreshResponse.EnsureSuccessStatusCode();
            var refreshContent = await refreshResponse.Content.ReadFromJsonAsync<RefreshResponseDto>();
            Assert.NotNull(refreshContent);
            Assert.False(string.IsNullOrEmpty(refreshContent.Tokens?.NewAccessToken));
            Assert.False(string.IsNullOrEmpty(refreshContent.Tokens?.NewRefreshToken));

            // Logout (requires bearer token)
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", loginContent.TokenPair.AccessToken);
            var logoutResponse = await client.PostAsync("/api/user/logout", null);
            logoutResponse.EnsureSuccessStatusCode();
        }
/// <summary>
/// Integration tests for recaptcha verification.
/// </summary>

        /// <summary>
        /// Verifies that recaptcha endpoint returns success with fake service.
        /// </summary>
        [Fact]
        public async Task Recaptcha_Verify_ReturnsSuccess()
        {
            var client = _factory.CreateClient();
            var response = await client.PostAsJsonAsync("/api/user/recaptcha/verify", new { token = "dummy-token" });
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadFromJsonAsync<RecaptchaVerifyResponseDto>();
            Assert.NotNull(content);
            Assert.True(content.Success);
        }

        /// <summary>
        /// DTO for login responses.
        /// </summary>
        private class LoginResponseDto
        {
            public bool Success { get; set; }
            public TokenPairDto? TokenPair { get; set; }
        }

        /// <summary>
        /// DTO for token pairs.
        /// </summary>
        private class TokenPairDto
        {
            public string? AccessToken { get; set; }
            public string? RefreshToken { get; set; }
        }

        /// <summary>
        /// Request payload for refresh token.
        /// </summary>
        private class RefreshRequest
        {
            public string AccessToken { get; set; } = string.Empty;
            public string RefreshToken { get; set; } = string.Empty;
        }

        /// <summary>
        /// DTO for refresh response.
        /// </summary>
        private class RefreshResponseDto
        {
            public bool Success { get; set; }
            public TokensDto? Tokens { get; set; }
        }
/// <summary>
/// DTO for token refresh responses.
/// </summary>

        /// <summary>
        /// DTO for refreshed tokens.
        /// </summary>
        private class TokensDto
        {
            public string? NewAccessToken { get; set; }
            public string? NewRefreshToken { get; set; }
        }

        /// <summary>
        /// DTO for recaptcha verify response.
        /// </summary>
        private class RecaptchaVerifyResponseDto
        {
            public bool Success { get; set; }
        }
    }
}
