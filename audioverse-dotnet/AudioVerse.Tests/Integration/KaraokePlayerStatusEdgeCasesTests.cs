using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using AudioVerse.Tests.Integration;
using System.Threading.Tasks;
using AudioVerse.Application.Models.Requests.Karaoke;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;

namespace AudioVerse.Tests.Integration
{
    public class KaraokePlayerStatusEdgeCasesTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public KaraokePlayerStatusEdgeCasesTests(CustomWebApplicationFactory factory) { _factory = factory; }

        [Fact]
        public async Task InvalidEnumValue_Returns_BadRequest()
        {
            using var client = _factory.CreateClient();
            // pick some party/player
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId;

            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateAdminToken());
            // craft invalid payload (numeric outside enum)
            var invalid = new { Status = 9999 };
            var patchResp = await client.PatchAsJsonAsync($"/api/karaoke/events/{eventId}/participants/{playerId}/status", invalid);
            Assert.Equal(HttpStatusCode.BadRequest, patchResp.StatusCode);
        }

        [Fact]
        public async Task MissingAssignment_Returns_NotFound()
        {
            using var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateAdminToken());
            // use non-existing event/player combo
            var patchResp = await client.PatchAsJsonAsync($"/api/karaoke/events/999999/participants/999999/status", new UpdateKaraokePlayerStatusRequest { Status = KaraokePlayerStatus.Inside });
            Assert.Equal(HttpStatusCode.NotFound, patchResp.StatusCode);
        }

        [Fact]
        public async Task DuplicateAssignment_Posting_Same_Returns_ExistingId()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerse.Infrastructure.Persistence.AudioVerseDbContext>();
            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            var eventId = party!.Id;
            var playerId = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().First().PlayerId;

            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateTokenForTestUser());
            var req = new AudioVerse.Application.Models.Requests.Karaoke.AddRoundPlayerRequest { PlayerId = playerId, Slot = 5 };
            var first = await client.PostAsJsonAsync($"/api/karaoke/rounds/1/players", req);
            first.EnsureSuccessStatusCode();
            var firstBody = await first.Content.ReadFromJsonAsync<JsonElement>();
            int id1 = firstBody.GetProperty("id").GetInt32();

            var second = await client.PostAsJsonAsync($"/api/karaoke/rounds/1/players", req);
            second.EnsureSuccessStatusCode();
            var secondBody = await second.Content.ReadFromJsonAsync<JsonElement>();
            int id2 = secondBody.GetProperty("id").GetInt32();

            Assert.Equal(id1, id2);
        }
    }
}
