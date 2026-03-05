using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Tests.Integration;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Domain.Entities.Karaoke;
using AudioVerse.Domain.Entities.Karaoke.KaraokeSessions;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Tests.Integration
{
    public class EventsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public EventsIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        [Fact]
        public async Task AddParticipantToEvent_AsOrganizer_Succeeds()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now

            var eventId = party.Id;

            // find a player NOT already in the party
            var existingPlayerIds = db.KaraokeEventPlayers.Where(pp => pp.EventId == party.Id).ToList().Select(pp => pp.PlayerId).ToHashSet();
            var newPlayer = await db.UserProfilePlayers.FirstOrDefaultAsync(p => !existingPlayerIds.Contains(p.Id));
            Assert.NotNull(newPlayer);

            // authenticate as organizer
            var token = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/participants", new { UserId = newPlayer!.ProfileId });
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        [Fact]
        public async Task AddInviteToEvent_Succeeds()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;

            var token = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var invite = new EventInvite { EventId = party.Id, ToEmail = "newguest@example.com", FromUserId = party.OrganizerId, Message = "Please join" };
            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/invites", invite);
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            int id = body.GetProperty("inviteId").GetInt32();
            Assert.True(id > 0);

            var stored = await db.EventInvites.FirstOrDefaultAsync(pi => pi.Id == id);
            Assert.NotNull(stored);
            Assert.Equal(eventId, stored!.EventId);
        }

        [Fact]
        public async Task AddSessionToEvent_Succeeds()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;

            var token = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var session = new KaraokeSession { EventId = party.Id, Name = "Integration Session" };
            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/sessions", session);
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            int id = body.GetProperty("sessionId").GetInt32();
            Assert.True(id > 0);

            var stored = await db.KaraokeSessions.FirstOrDefaultAsync(s => s.Id == id);
            Assert.NotNull(stored);
            Assert.Equal(eventId, stored!.EventId);
        }
    }
}
