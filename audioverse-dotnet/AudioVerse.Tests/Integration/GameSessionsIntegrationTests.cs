using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    public class GameSessionsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public GameSessionsIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

        private HttpClient CreateAuthClient()
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("1", "admin");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        private int GetFirstEventId()
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            return db.Events.First().Id;
        }

        // ═══════════════════════════════════════════════
        //  BOARD GAME SESSIONS
        // ═══════════════════════════════════════════════

        [Fact]
        public async Task BoardGameSession_CRUD_Works()
        {
            var client = CreateAuthClient();
            var eventId = GetFirstEventId();

            // Create session
            var createRes = await client.PostAsJsonAsync("/api/games/board/sessions", new { EventId = eventId });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
            var createBody = JsonSerializer.Deserialize<JsonElement>(await createRes.Content.ReadAsStringAsync());
            var sessionId = createBody.GetProperty("id").GetInt32();
            Assert.True(sessionId > 0);

            // Get sessions by event
            var listRes = await client.GetAsync($"/api/games/board/sessions/event/{eventId}");
            Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

            // Get session by ID
            var getRes = await client.GetAsync($"/api/games/board/sessions/{sessionId}");
            Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);

            // Add round
            var roundRes = await client.PostAsJsonAsync($"/api/games/board/sessions/{sessionId}/rounds", new { Number = 1 });
            Assert.Equal(HttpStatusCode.Created, roundRes.StatusCode);
            var roundBody = JsonSerializer.Deserialize<JsonElement>(await roundRes.Content.ReadAsStringAsync());
            var roundId = roundBody.GetProperty("id").GetInt32();

            // Get rounds
            var roundsRes = await client.GetAsync($"/api/games/board/sessions/{sessionId}/rounds");
            Assert.Equal(HttpStatusCode.OK, roundsRes.StatusCode);

            // Add part
            var partRes = await client.PostAsJsonAsync($"/api/games/board/rounds/{roundId}/parts", new { Name = "Part A", Duration = "00:10:00" });
            Assert.Equal(HttpStatusCode.Created, partRes.StatusCode);
            var partBody = JsonSerializer.Deserialize<JsonElement>(await partRes.Content.ReadAsStringAsync());
            var partId = partBody.GetProperty("id").GetInt32();

            // Add player to part
            var playerRes = await client.PostAsJsonAsync($"/api/games/board/parts/{partId}/players", new { PlayerId = 1 });
            Assert.Equal(HttpStatusCode.Created, playerRes.StatusCode);
            var playerBody = JsonSerializer.Deserialize<JsonElement>(await playerRes.Content.ReadAsStringAsync());
            var playerId = playerBody.GetProperty("id").GetInt32();

            // Update score
            var scoreRes = await client.PatchAsync($"/api/games/board/part-players/{playerId}/score",
                JsonContent.Create(42));
            Assert.Equal(HttpStatusCode.OK, scoreRes.StatusCode);

            // Delete player
            var delPlayerRes = await client.DeleteAsync($"/api/games/board/part-players/{playerId}");
            Assert.Equal(HttpStatusCode.NoContent, delPlayerRes.StatusCode);

            // Delete part
            var delPartRes = await client.DeleteAsync($"/api/games/board/parts/{partId}");
            Assert.Equal(HttpStatusCode.NoContent, delPartRes.StatusCode);

            // Delete round
            var delRoundRes = await client.DeleteAsync($"/api/games/board/rounds/{roundId}");
            Assert.Equal(HttpStatusCode.NoContent, delRoundRes.StatusCode);

            // Delete session
            var delRes = await client.DeleteAsync($"/api/games/board/sessions/{sessionId}");
            Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);
        }

        [Fact]
        public async Task BoardGameCollection_CRUD_Works()
        {
            var client = CreateAuthClient();

            // Create collection
            var createRes = await client.PostAsJsonAsync("/api/games/board/collections", new { OwnerId = 1, Name = "My Board Games", IsPublic = true });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
            var createBody = JsonSerializer.Deserialize<JsonElement>(await createRes.Content.ReadAsStringAsync());
            var collId = createBody.GetProperty("id").GetInt32();

            // Get by ID
            var getRes = await client.GetAsync($"/api/games/board/collections/{collId}");
            Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);

            // Get by owner
            var ownerRes = await client.GetAsync("/api/games/board/collections/owner/1");
            Assert.Equal(HttpStatusCode.OK, ownerRes.StatusCode);

            // Update
            var updateRes = await client.PutAsJsonAsync($"/api/games/board/collections/{collId}", new { Name = "Updated", IsPublic = false });
            Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

            // Delete
            var delRes = await client.DeleteAsync($"/api/games/board/collections/{collId}");
            Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);
        }

        // ═══════════════════════════════════════════════
        //  COUCH GAME SESSIONS
        // ═══════════════════════════════════════════════

        [Fact]
        public async Task VideoGameSession_CRUD_Works()
        {
            var client = CreateAuthClient();
            var eventId = GetFirstEventId();

            // First create a video game to reference
            var gameRes = await client.PostAsJsonAsync("/api/games/video", new { Name = "Test Video Game", Platform = 0, MinPlayers = 1, MaxPlayers = 4 });
            Assert.True(gameRes.StatusCode == System.Net.HttpStatusCode.Created || gameRes.StatusCode == System.Net.HttpStatusCode.OK);
            var gameBody = JsonSerializer.Deserialize<JsonElement>(await gameRes.Content.ReadAsStringAsync());
            var videoGameId = gameBody.GetProperty("id").GetInt32();

            // Create session
            var createRes = await client.PostAsJsonAsync("/api/games/video/sessions", new { EventId = eventId, VideoGameId = videoGameId });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
            var createBody = JsonSerializer.Deserialize<JsonElement>(await createRes.Content.ReadAsStringAsync());
            var sessionId = createBody.GetProperty("id").GetInt32();

            // Get sessions by event
            var listRes = await client.GetAsync($"/api/games/video/sessions/event/{eventId}");
            Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

            // Get by ID
            var getRes = await client.GetAsync($"/api/games/video/sessions/{sessionId}");
            Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);

            // Add player
            var playerRes = await client.PostAsJsonAsync($"/api/games/video/sessions/{sessionId}/players", new { PlayerId = 1 });
            Assert.Equal(HttpStatusCode.Created, playerRes.StatusCode);
            var playerBody = JsonSerializer.Deserialize<JsonElement>(await playerRes.Content.ReadAsStringAsync());
            var playerId = playerBody.GetProperty("id").GetInt32();

            // Update score
            var scoreRes = await client.PatchAsync($"/api/games/video/session-players/{playerId}/score",
                JsonContent.Create(99));
            Assert.Equal(HttpStatusCode.OK, scoreRes.StatusCode);

            // Delete player
            var delPlayerRes = await client.DeleteAsync($"/api/games/video/session-players/{playerId}");
            Assert.Equal(HttpStatusCode.NoContent, delPlayerRes.StatusCode);

            // Delete session
            var delRes = await client.DeleteAsync($"/api/games/video/sessions/{sessionId}");
            Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);
        }

        [Fact]
        public async Task VideoGameCollection_CRUD_Works()
        {
            var client = CreateAuthClient();

            // Create collection
            var createRes = await client.PostAsJsonAsync("/api/games/video/collections", new { OwnerId = 1, Name = "My Video Games", IsPublic = true });
            Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
            var createBody = JsonSerializer.Deserialize<JsonElement>(await createRes.Content.ReadAsStringAsync());
            var collId = createBody.GetProperty("id").GetInt32();

            // Get by ID
            var getRes = await client.GetAsync($"/api/games/video/collections/{collId}");
            Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);

            // Get by owner
            var ownerRes = await client.GetAsync("/api/games/video/collections/owner/1");
            Assert.Equal(HttpStatusCode.OK, ownerRes.StatusCode);

            // Update
            var updateRes = await client.PutAsJsonAsync($"/api/games/video/collections/{collId}", new { Name = "Updated Video", IsPublic = false });
            Assert.Equal(HttpStatusCode.OK, updateRes.StatusCode);

            // Delete
            var delRes = await client.DeleteAsync($"/api/games/video/collections/{collId}");
            Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);
        }
    }
}
