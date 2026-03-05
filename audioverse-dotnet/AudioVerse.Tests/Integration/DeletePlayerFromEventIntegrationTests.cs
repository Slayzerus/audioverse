using System.Net;
using System.Net.Http.Json;
using Xunit;
using AudioVerse.Tests.Integration;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;

namespace AudioVerse.Tests.Integration
{
    public class DeletePlayerFromEventIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public DeletePlayerFromEventIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        /// <summary>
        /// Ensures a participant exists for the given event by re-adding via the API.
        /// </summary>
        private async Task EnsureParticipantExistsAsync(HttpClient client, int eventId, int userId, string organizerToken)
        {
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", organizerToken);
            await client.PostAsJsonAsync($"/api/events/{eventId}/participants", new { UserId = userId });
        }

        [Fact]
        public async Task Organizer_Can_Delete_Player()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var player = await db.UserProfilePlayers.FirstOrDefaultAsync();
            Assert.NotNull(player);
            var playerId = player!.Id;
            var userId = player.ProfileId;

            var organizerToken = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            await EnsureParticipantExistsAsync(client, eventId, userId, organizerToken);

            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", organizerToken);
            var resp = await client.DeleteAsync($"/api/karaoke/events/{eventId}/participants/{playerId}");
            Assert.True(resp.StatusCode == HttpStatusCode.NoContent || resp.StatusCode == HttpStatusCode.OK);
        }

        [Fact]
        public async Task Admin_Can_Delete_Player()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var player = await db.UserProfilePlayers.FirstOrDefaultAsync();
            Assert.NotNull(player);
            var playerId = player!.Id;
            var userId = player.ProfileId;

            var organizerToken = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            await EnsureParticipantExistsAsync(client, eventId, userId, organizerToken);

            var adminToken = JwtTokenHelper.GenerateAdminToken();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);
            var resp = await client.DeleteAsync($"/api/karaoke/events/{eventId}/participants/{playerId}");
            Assert.True(resp.StatusCode == HttpStatusCode.NoContent || resp.StatusCode == HttpStatusCode.OK);
        }

        [Fact]
        public async Task Owner_Can_Delete_Their_Player()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var player = await db.UserProfilePlayers.FirstOrDefaultAsync();
            Assert.NotNull(player);
            var playerId = player!.Id;
            var userId = player.ProfileId;

            var organizerToken = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            await EnsureParticipantExistsAsync(client, eventId, userId, organizerToken);

            // Owner (profile id) is set to profile 2 in seeder; generate token for that profile
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateTokenForTestUser());
            var resp = await client.DeleteAsync($"/api/karaoke/events/{eventId}/participants/{playerId}");
            Assert.True(resp.StatusCode == HttpStatusCode.NoContent || resp.StatusCode == HttpStatusCode.OK);
        }

        [Fact]
        public async Task OtherUser_Cannot_Delete_Player()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var player = await db.UserProfilePlayers.FirstOrDefaultAsync();
            Assert.NotNull(player);
            var playerId = player!.Id;
            var userId = player.ProfileId;

            var organizerToken = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            await EnsureParticipantExistsAsync(client, eventId, userId, organizerToken);

            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateTokenForAnotherUser());
            var resp = await client.DeleteAsync($"/api/karaoke/events/{eventId}/participants/{playerId}");
            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }
    }
}
