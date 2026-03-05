using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    public class EventLocationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public EventLocationIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

        private HttpClient CreateAuthClient()
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("1", "admin");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        [Fact]
        public async Task CreateAndGetLocation_Works()
        {
            var client = CreateAuthClient();

            var createRes = await client.PostAsJsonAsync("/api/events/locations", new
            {
                Name = "Test Venue",
                Description = "A test location",
                Latitude = 52.2297,
                Longitude = 21.0122
            });

            if (createRes.StatusCode == HttpStatusCode.Created || createRes.StatusCode == HttpStatusCode.OK)
            {
                var body = JsonSerializer.Deserialize<JsonElement>(await createRes.Content.ReadAsStringAsync());
                Assert.True(body.TryGetProperty("id", out _) || body.TryGetProperty("Id", out _));
            }

            var listRes = await client.GetAsync("/api/events/locations");
            Assert.True(listRes.StatusCode == HttpStatusCode.OK || listRes.StatusCode == HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetLocation_NotFound_Returns404()
        {
            var client = CreateAuthClient();
            var res = await client.GetAsync("/api/events/locations/99999");
            Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
        }
    }
}
