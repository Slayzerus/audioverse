using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration
{
    public class EventSubResourcesIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public EventSubResourcesIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

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

        // ?? Schedule ??

        [Fact]
        public async Task Schedule_CRUD_Works()
        {
            var (client, eventId) = Setup();

            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/schedule", new { Name = "Opening", StartTime = DateTime.UtcNow, Category = 0 });
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

            resp = await client.GetAsync($"/api/events/{eventId}/schedule");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(body.GetArrayLength() > 0);
        }

        // ?? Menu ??

        [Fact]
        public async Task Menu_CRUD_Works()
        {
            var (client, eventId) = Setup();

            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/menu", new { Name = "Pizza Margherita", Category = 0, Price = 25.00 });
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

            resp = await client.GetAsync($"/api/events/{eventId}/menu");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(body.GetArrayLength() > 0);
        }

        // ?? Attractions ??

        [Fact]
        public async Task Attractions_CRUD_Works()
        {
            var (client, eventId) = Setup();

            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/attractions", new { Name = "Fotobudka", Type = 0, Price = 200 });
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);

            resp = await client.GetAsync($"/api/events/{eventId}/attractions");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? Board Games ??

        [Fact]
        public async Task BoardGames_CreateAndAssignToEvent()
        {
            var (client, eventId) = Setup();

            var resp = await client.PostAsJsonAsync("/api/games/board", new { Name = "Catan", MinPlayers = 3, MaxPlayers = 4 });
            Assert.True(resp.StatusCode == HttpStatusCode.Created || resp.StatusCode == HttpStatusCode.OK);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var bgId = body.GetProperty("id").GetInt32();

            resp = await client.PostAsJsonAsync($"/api/events/{eventId}/board-games", new { BoardGameId = bgId });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync($"/api/events/{eventId}/board-games");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ── Video Games ──

        [Fact]
        public async Task VideoGames_CreateAndAssignToEvent()
        {
            var (client, eventId) = Setup();

            var resp = await client.PostAsJsonAsync("/api/games/video", new { Name = "Overcooked 2", Platform = 0 });
            Assert.True(resp.StatusCode == HttpStatusCode.Created || resp.StatusCode == HttpStatusCode.OK);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var cgId = body.GetProperty("id").GetInt32();

            resp = await client.PostAsJsonAsync($"/api/events/{eventId}/video-games", new { VideoGameId = cgId });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync($"/api/events/{eventId}/video-games");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }
    }
}
