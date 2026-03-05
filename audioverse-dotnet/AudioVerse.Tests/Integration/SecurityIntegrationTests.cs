using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration
{
    /// <summary>Security tests — authorization negatives, fuzz, injection smoke tests</summary>
    public class SecurityIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public SecurityIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        // ?? Authorization negatives ??

        [Theory]
        [InlineData("GET", "/api/admin/dashboard")]
        [InlineData("GET", "/api/admin/events")]
        public async Task AdminEndpoints_WithoutAuth_Returns401or403(string method, string url)
        {
            var client = _factory.CreateClient();
            var resp = method == "GET"
                ? await client.GetAsync(url)
                : await client.PostAsync(url, null);
            Assert.True(resp.StatusCode == HttpStatusCode.Unauthorized || resp.StatusCode == HttpStatusCode.Forbidden,
                $"{method} {url} returned {resp.StatusCode} instead of 401/403");
        }

        [Theory]
        [InlineData("GET", "/api/admin/dashboard")]
        [InlineData("GET", "/api/admin/events")]
        public async Task AdminEndpoints_WithNonAdminToken_Returns403(string _, string url)
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("1", "regularuser");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var resp = await client.GetAsync(url);
            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }

        [Theory]
        [InlineData("/api/karaoke/filter-songs")]
        [InlineData("/api/karaoke/search-songs")]
        public async Task KaraokeEndpoints_WithoutAuth_Returns401(string url)
        {
            var client = _factory.CreateClient();
            var resp = await client.GetAsync(url);
            Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        }

        [Fact]
        public async Task ExpiredToken_Returns401()
        {
            var client = _factory.CreateClient();
            // Token with past expiry
            var handler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("integration-test-secret-key-1234567890");
            var descriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
            {
                Subject = new System.Security.Claims.ClaimsIdentity(new[]
                {
                    new System.Security.Claims.Claim("id", "1"),
                    new System.Security.Claims.Claim("username", "expired")
                }),
                Expires = DateTime.UtcNow.AddHours(-1),
                NotBefore = DateTime.UtcNow.AddHours(-2),
                IssuedAt = DateTime.UtcNow.AddHours(-2),
                SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
                    new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                    Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
            };
            var expired = handler.WriteToken(handler.CreateToken(descriptor));
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", expired);
            var resp = await client.GetAsync("/api/karaoke/filter-songs");
            Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        }

        // ?? SQL injection smoke tests ??

        [Theory]
        [InlineData("/api/karaoke/search-songs?q='; DROP TABLE KaraokeSongs;--")]
        [InlineData("/api/karaoke/search-songs?q=1' OR '1'='1")]
        [InlineData("/api/karaoke/search-songs?q=Robert'); DROP TABLE Students;--")]
        public async Task SqlInjection_DoesNotCrash(string url)
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("1", "tester");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await client.GetAsync(url);
            // Should not be 500 — SQL injection should be parameterized
            Assert.NotEqual(HttpStatusCode.InternalServerError, resp.StatusCode);
        }

        // ?? Fuzz testing JSON input ??

        [Theory]
        [InlineData("{}")]
        [InlineData("{\"Name\": null}")]
        [InlineData("{\"Name\": \"\"}")]
        [InlineData("{\"Name\": \"" + "A" + "\"}")]  // valid short
        [InlineData("not-json-at-all")]
        [InlineData("{\"Name\": 12345}")]
        [InlineData("[1,2,3]")]
        public async Task FuzzJson_PostTeam_DoesNotCrash(string body)
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("2", "fuzzer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var content = new StringContent(body, Encoding.UTF8, "application/json");
            var resp = await client.PostAsync("/api/karaoke/teams", content);

            // Should be 400 or similar, never 500
            Assert.NotEqual(HttpStatusCode.InternalServerError, resp.StatusCode);
        }

        [Theory]
        [InlineData("{}")]
        [InlineData("{\"Title\": null, \"Amount\": \"not-a-number\"}")]
        [InlineData("")]
        [InlineData("{\"Title\": \"<script>alert('xss')</script>\", \"Amount\": 100}")]
        public async Task FuzzJson_PostExpense_DoesNotCrash(string body)
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("1", "fuzzer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var ev = db.Events.FirstOrDefault();
            if (ev == null) return;

            var content = new StringContent(body, Encoding.UTF8, "application/json");
            var resp = await client.PostAsync($"/api/events/{ev.Id}/billing/expenses", content);
            Assert.NotEqual(HttpStatusCode.InternalServerError, resp.StatusCode);
        }

        // ?? XSS / profanity filter ??

        [Fact]
        public async Task ProfanityFilter_BlocksBadWords()
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("2", "tester");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var payload = new { Name = "kurwa team", EventId = 1, CreatedByPlayerId = 1 };
            var resp = await client.PostAsJsonAsync("/api/karaoke/teams", payload);
            // ProfanityMiddleware should block with 400
            Assert.Equal(HttpStatusCode.BadRequest, resp.StatusCode);
        }

        // ?? Protected controllers — unauthenticated access returns 401 ??

        [Theory]
        [InlineData("GET", "/api/audio-editor/projects")]
        [InlineData("GET", "/api/editor/effects")]
        [InlineData("GET", "/api/dmx/scenes")]
        [InlineData("GET", "/api/playlists")]
        [InlineData("GET", "/api/library/files/audio")]
        [InlineData("GET", "/api/library/soundfonts")]
        public async Task ProtectedEndpoints_WithoutAuth_Returns401(string method, string url)
        {
            var client = _factory.CreateClient();
            var resp = method == "GET"
                ? await client.GetAsync(url)
                : await client.PostAsync(url, null);
            Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
        }

        // ?? IDOR — user cannot access/modify other user's resources ??

        [Fact]
        public async Task IDOR_UserCannotDeleteOtherUsersNotification()
        {
            var client = _factory.CreateClient();

            // User 2 creates a notification
            var token2 = JwtTokenHelper.GenerateToken("2", "user1");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token2);
            var createResp = await client.PostAsJsonAsync("/api/user/notifications", new { Title = "IDOR Test", Message = "Secret", Type = "info" });
            if (createResp.StatusCode != HttpStatusCode.Created) return;
            var body = await createResp.Content.ReadFromJsonAsync<JsonElement>();
            var notificationId = body.GetProperty("id").GetInt32();

            // User 3 tries to delete user 2's notification
            var token3 = JwtTokenHelper.GenerateToken("3", "user2");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token3);
            var deleteResp = await client.DeleteAsync($"/api/user/notifications/{notificationId}");
            Assert.True(
                deleteResp.StatusCode == HttpStatusCode.NotFound || deleteResp.StatusCode == HttpStatusCode.Forbidden,
                $"IDOR: user 3 was able to delete user 2's notification, got {deleteResp.StatusCode}");
        }

        [Fact]
        public async Task IDOR_NonOrganizerCannotAddSessionToEvent()
        {
            var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var ev = db.Events.FirstOrDefault();
            if (ev == null) return;

            // user 4 is not the organizer
            var token = JwtTokenHelper.GenerateToken("4", "outsider");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await client.PostAsJsonAsync($"/api/events/{ev.Id}/sessions", new { Name = "Hacked Session" });
            Assert.True(
                resp.StatusCode == HttpStatusCode.Forbidden || resp.StatusCode == HttpStatusCode.Unauthorized,
                $"IDOR: non-organizer could POST session, got {resp.StatusCode}");
        }

        [Fact]
        public async Task IDOR_NonOrganizerCannotAddParticipant()
        {
            var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var ev = db.Events.FirstOrDefault();
            if (ev == null) return;

            // user 4 is not the organizer
            var token = JwtTokenHelper.GenerateToken("4", "outsider");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await client.PostAsJsonAsync($"/api/events/{ev.Id}/participants", new { UserId = 3 });
            Assert.True(
                resp.StatusCode == HttpStatusCode.Forbidden || resp.StatusCode == HttpStatusCode.Unauthorized,
                $"IDOR: non-organizer could add participant, got {resp.StatusCode}");
        }

        // ?? Public endpoints — intentionally open, should return 200 ??

        [Theory]
        [InlineData("/api/genres")]
        [InlineData("/api/admin/config/karaoke-scoring")]
        public async Task PublicEndpoints_WithoutAuth_ReturnsOk(string url)
        {
            var client = _factory.CreateClient();
            var resp = await client.GetAsync(url);
            Assert.True(
                resp.StatusCode == HttpStatusCode.OK || resp.StatusCode == HttpStatusCode.NotFound,
                $"Public endpoint {url} returned unexpected {resp.StatusCode}");
        }
    }
}
