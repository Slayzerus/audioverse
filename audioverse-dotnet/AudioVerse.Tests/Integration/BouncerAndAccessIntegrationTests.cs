using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration
{
    public class BouncerAndAccessIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public BouncerAndAccessIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private (HttpClient client, int eventId) Setup()
        {
            var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var party = db.Events.First();
            var token = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            return (client, party.Id);
        }

        [Fact]
        public async Task GenerateAccessLink_Returns_Token()
        {
            var (client, eventId) = Setup();

            var resp = await client.PostAsync($"/api/events/{eventId}/generate-link", null);
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var linkToken = body.GetProperty("token").GetString();
            Assert.False(string.IsNullOrEmpty(linkToken));

            // Join via link (anonymous)
            var anonClient = _factory.CreateClient();
            resp = await anonClient.GetAsync($"/api/events/join/{linkToken}");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var joinBody = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal(eventId, joinBody.GetProperty("eventId").GetInt32());
        }

        [Fact]
        public async Task JoinViaLink_InvalidToken_Returns404()
        {
            var anonClient = _factory.CreateClient();
            var resp = await anonClient.GetAsync("/api/events/join/nonexistenttoken12345");
            Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
        }

        [Fact]
        public async Task Bouncer_GetWaiting_ReturnsOk()
        {
            var (client, eventId) = Setup();

            var resp = await client.GetAsync($"/api/events/{eventId}/bouncer/waiting");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        [Fact]
        public async Task AdminDashboard_ReturnsStats()
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateAdminToken();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await client.GetAsync("/api/admin/dashboard");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(body.GetProperty("totalUsers").GetInt32() >= 0);
            Assert.True(body.GetProperty("totalSongs").GetInt32() >= 0);
        }

        [Fact]
        public async Task AdminEvents_ReturnsPaginated()
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateAdminToken();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await client.GetAsync("/api/admin/events?page=1&pageSize=5");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(body.GetProperty("total").GetInt32() >= 0);
        }
    }
}
