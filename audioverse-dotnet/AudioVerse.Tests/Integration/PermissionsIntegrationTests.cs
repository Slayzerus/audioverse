using Xunit;
using System.Net.Http.Json;
using System.Net;
using AudioVerse.Tests.Integration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Tests.Integration
{
    public class PermissionsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public PermissionsIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        [Fact]
        public async Task Organizer_Can_Grant_And_Revoke_Permission()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            var eventId = party!.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId;

            var organizerToken = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", organizerToken);

            var grantResp = await client.PostAsync($"/api/permissions/events/{eventId}/players/{playerId}/grant?permission=Invite", null);
            Assert.True(grantResp.IsSuccessStatusCode);

            var revokeResp = await client.PostAsync($"/api/permissions/events/{eventId}/players/{playerId}/revoke?permission=Invite", null);
            Assert.True(revokeResp.IsSuccessStatusCode);
        }

        [Fact]
        public async Task Bulk_Grant_And_Revoke_Work()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            var eventId = party!.Id;
            var entries = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().Take(2).Select(pp => new { playerId = pp.PlayerId, permission = (int)EventPermission.Invite }).ToList();

            var organizerToken = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", organizerToken);

            var grantResp = await client.PostAsJsonAsync($"/api/permissions/events/{eventId}/players/permissions/bulk", entries);
            Assert.True(grantResp.IsSuccessStatusCode);

            var revokeResp = await client.PostAsJsonAsync($"/api/permissions/events/{eventId}/players/permissions/bulk-revoke", entries);
            Assert.True(revokeResp.IsSuccessStatusCode);
        }
    }
}
