using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration
{
    public class TeamsAndQueueIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public TeamsAndQueueIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private (HttpClient client, int eventId, int organizerPlayerId, int organizerProfileId) Setup()
        {
            var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var party = db.Events.Include(p => p.Organizer).First();
            // JWT "id" claim must match UserProfile.Id for ownership checks
            var profileId = party.Organizer?.Id ?? party.OrganizerId;
            var token = JwtTokenHelper.GenerateToken(profileId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            // OrganizerId stores ProfileId — resolve the actual PlayerProfilePlayer.Id for API calls
            var organizerPlayer = db.UserProfilePlayers.FirstOrDefault(p => p.ProfileId == profileId);
            var playerId = organizerPlayer?.Id ?? 0;
            return (client, party.Id, playerId, profileId ?? 0);
        }

        // ?? Teams ??

        [Fact]
        public async Task Team_CreateAndAddPlayer()
        {
            var (client, eventId, organizerPlayerId, _) = Setup();

            var resp = await client.PostAsJsonAsync("/api/karaoke/teams", new { Name = "Blue Team", EventId = eventId, CreatedByPlayerId = organizerPlayerId, Color = "#0000FF" });
            Assert.True(resp.IsSuccessStatusCode, $"Create team failed: {resp.StatusCode} - {await resp.Content.ReadAsStringAsync()}");
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var teamId = body.GetProperty("id").GetInt32();
            Assert.True(teamId > 0);

            // Get teams by event
            resp = await client.GetAsync($"/api/karaoke/events/{eventId}/teams");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var teams = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(teams.GetArrayLength() > 0);

            // Add player to team
            resp = await client.PostAsJsonAsync($"/api/karaoke/teams/{teamId}/players", new { PlayerId = organizerPlayerId, Role = "Captain" });
            Assert.True(resp.IsSuccessStatusCode);

            // Get team players
            resp = await client.GetAsync($"/api/karaoke/teams/{teamId}/players");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? Song Queue ??

        [Fact]
        public async Task SongQueue_AddAndList()
        {
            var (client, eventId, organizerPlayerId, _) = Setup();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var song = await db.KaraokeSongs.FirstAsync();

            var resp = await client.PostAsJsonAsync($"/api/karaoke/events/{eventId}/queue",
                new { EventId = eventId, SongId = song.Id, RequestedByPlayerId = organizerPlayerId, Position = 1, Status = 0 });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync($"/api/karaoke/events/{eventId}/queue");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var queue = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(queue.GetArrayLength() > 0);
        }

        // ?? Favorites ??

        [Fact]
        public async Task Favorites_AddAndRemove()
        {
            var (client, eventId, organizerPlayerId, _) = Setup();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var song = await db.KaraokeSongs.FirstAsync();

            // Add favorite
            var resp = await client.PostAsync($"/api/karaoke/players/{organizerPlayerId}/favorites/{song.Id}", null);
            Assert.True(resp.IsSuccessStatusCode);

            // Get favorites
            resp = await client.GetAsync($"/api/karaoke/players/{organizerPlayerId}/favorites");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

            // Remove favorite
            resp = await client.DeleteAsync($"/api/karaoke/players/{organizerPlayerId}/favorites/{song.Id}");
            Assert.True(resp.IsSuccessStatusCode);
        }

        // ?? Advanced Search ??

        [Fact]
        public async Task SearchSongs_ReturnsResults()
        {
            var (client, _, _, _) = Setup();

            var resp = await client.GetAsync("/api/karaoke/search-songs?q=Test&sortBy=title");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var songs = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(songs.GetArrayLength() > 0);
        }
    }
}
