using System.Net;
using System.Net.Http.Json;
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
    public class EventsPermissionTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public EventsPermissionTests(CustomWebApplicationFactory factory) { _factory = factory; }

        [Fact]
        public async Task NonOrganizer_Cannot_Add_Participant()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;

            // authenticate as another normal user
            var token = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var participant = new KaraokeSessionPlayer { PlayerId = 1, EventId = party.Id };
            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/participants", participant);
            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }

        [Fact]
        public async Task NonOrganizer_Cannot_Add_Invite()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;

            var token = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var invite = new EventInvite { EventId = party.Id, ToEmail = "badguest@example.com", FromUserId = 999, Message = "Please join" };
            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/invites", invite);
            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }

        [Fact]
        public async Task NonOrganizer_Cannot_Add_Session()
        {
            using var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var party = await db.Events.FirstOrDefaultAsync();
            Assert.NotNull(party);
            // Event IS the party now
            var eventId = party.Id;

            var token = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            var session = new KaraokeSession { EventId = party.Id, Name = "Bad Session" };
            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/sessions", session);
            Assert.Equal(HttpStatusCode.Forbidden, resp.StatusCode);
        }
    }
}
