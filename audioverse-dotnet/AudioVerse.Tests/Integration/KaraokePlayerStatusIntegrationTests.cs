using System.Net;
using System.Net.Http.Json;
using Xunit;
using AudioVerse.Tests.Integration;
using System.Threading.Tasks;
using AudioVerse.Application.Models.Requests.Karaoke;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Tests.Integration
{
    public class KaraokePlayerStatusIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public KaraokePlayerStatusIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        [Fact]
        public async Task Organizer_Can_Set_Inside_Status()
        {
            using var client = _factory.CreateClient();

            // get seeded party and player ids from DB
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId; // organizer as player

            // organizer token: use party.OrganizerId as id claim (controller compares OrganizerId to claim)
            var organizerToken = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", organizerToken);

            var req = new UpdateKaraokePlayerStatusRequest { Status = KaraokePlayerStatus.Inside };
            var patchResp = await client.PatchAsJsonAsync($"/api/karaoke/events/{eventId}/participants/{playerId}/status", req);
            Assert.Equal(HttpStatusCode.OK, patchResp.StatusCode);
        }

        [Fact]
        public async Task Admin_Can_Set_Inside_Status()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId;

            var adminToken = JwtTokenHelper.GenerateAdminToken();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", adminToken);
            var req = new UpdateKaraokePlayerStatusRequest { Status = KaraokePlayerStatus.Inside };
            var patchResp = await client.PatchAsJsonAsync($"/api/karaoke/events/{eventId}/participants/{playerId}/status", req);
            Assert.Equal(HttpStatusCode.OK, patchResp.StatusCode);
        }

        [Fact]
        public async Task NonOwner_NonOrganizer_Cannot_Set_Inside_Status()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId;

            // token for different user (not organizer/admin)
            var otherToken = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", otherToken);

            var req = new UpdateKaraokePlayerStatusRequest { Status = KaraokePlayerStatus.Inside };
            var patchResp = await client.PatchAsJsonAsync($"/api/karaoke/events/{eventId}/participants/{playerId}/status", req);
            Assert.Equal(HttpStatusCode.Forbidden, patchResp.StatusCode);
        }
    }
}
