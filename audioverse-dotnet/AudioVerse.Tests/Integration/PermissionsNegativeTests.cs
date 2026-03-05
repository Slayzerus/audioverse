using System.Net;
using System.Net.Http.Json;
using Xunit;
using AudioVerse.Tests.Integration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Tests.Integration
{
    public class PermissionsNegativeTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public PermissionsNegativeTests(CustomWebApplicationFactory factory) { _factory = factory; }

        [Fact]
        public async Task NonOrganizer_Cannot_Grant_Permission()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            var eventId = party!.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId;

            // token for a different user (not organizer)
            var otherToken = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", otherToken);

            var grantResp = await client.PostAsync($"/api/permissions/events/{eventId}/players/{playerId}/grant?permission=Invite", null);
            Assert.Equal(HttpStatusCode.Forbidden, grantResp.StatusCode);
        }

        [Fact]
        public async Task NonOrganizer_Cannot_Revoke_Permission()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            var eventId = party!.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId;

            var otherToken = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", otherToken);

            var revokeResp = await client.PostAsync($"/api/permissions/events/{eventId}/players/{playerId}/revoke?permission=Invite", null);
            Assert.Equal(HttpStatusCode.Forbidden, revokeResp.StatusCode);
        }

        [Fact]
        public async Task NonOrganizer_Cannot_BulkGrant()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            var eventId = party!.Id;
            var entries = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().Take(2).Select(pp => new { playerId = pp.PlayerId, permission = (int)EventPermission.Invite }).ToList();

            var otherToken = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", otherToken);

            var grantResp = await client.PostAsJsonAsync($"/api/permissions/events/{eventId}/players/permissions/bulk", entries);
            Assert.Equal(HttpStatusCode.Forbidden, grantResp.StatusCode);
        }
    }
}
