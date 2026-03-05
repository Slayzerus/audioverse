using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    public class SkinThemeIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public SkinThemeIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private HttpClient CreateAdminClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateAdminToken());
            return client;
        }

        [Fact]
        public async Task GetPublicSkins_ReturnsOk()
        {
            using var client = CreateAdminClient();
            var response = await client.GetAsync("/api/admin/skins");
            Assert.True(response.IsSuccessStatusCode, $"Expected success but got {response.StatusCode}");
        }

        [Fact]
        public async Task AdminGetSkins_ReturnsOk()
        {
            using var client = CreateAdminClient();
            var response = await client.GetAsync("/api/admin/skins");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task AdminCreateSkin_ReturnsCreated()
        {
            using var client = CreateAdminClient();
            var skin = new
            {
                Name = "Test_" + Guid.NewGuid().ToString("N")[..6],
                Emoji = "🎨",
                Description = "Test skin",
                IsDark = false,
                BodyBackground = "#ffffff",
                Vars = new Dictionary<string, string> { { "--bg", "#fff" } },
                IsActive = true,
                IsSystem = false,
                SortOrder = 99
            };
            var response = await client.PostAsJsonAsync("/api/admin/skins", skin);
            var body = await response.Content.ReadAsStringAsync();
            Assert.True(response.StatusCode == HttpStatusCode.Created || response.StatusCode == HttpStatusCode.OK,
                $"Expected Created/OK but got {response.StatusCode}: {body}");
        }

        [Fact]
        public async Task AdminDeleteNonexistent_ReturnsNotFound()
        {
            using var client = CreateAdminClient();
            var response = await client.DeleteAsync("/api/admin/skins/999999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
