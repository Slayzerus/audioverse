using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration
{
    public class PollsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public PollsIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

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

        [Fact]
        public async Task CreatePoll_And_Vote_ReturnsResults()
        {
            var (client, eventId) = Setup();

            // Create poll
            var poll = new
            {
                EventId = eventId,
                Title = "Integration Test Poll",
                Type = 1, // MultiChoice
                OptionSource = 0, // Manual
                Options = new[]
                {
                    new { Text = "Option A", SortOrder = 0 },
                    new { Text = "Option B", SortOrder = 1 }
                }
            };
            var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/polls", poll);
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var pollId = body.GetProperty("id").GetInt32();
            Assert.True(pollId > 0);

            // List polls
            resp = await client.GetAsync($"/api/events/{eventId}/polls");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

            // Get poll by id to get token + option ids
            resp = await client.GetAsync($"/api/events/{eventId}/polls/{pollId}");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var pollBody = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var pollToken = pollBody.GetProperty("token").GetString();
            var options = pollBody.GetProperty("options");
            var optionId = options[0].GetProperty("id").GetInt32();

            // Vote (anonymous)
            var voteClient = _factory.CreateClient();
            resp = await voteClient.PostAsJsonAsync($"/api/events/polls/vote/{pollToken}", new { OptionIds = new[] { optionId }, Email = "test@test.pl" });
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

            // Results
            resp = await client.GetAsync($"/api/events/{eventId}/polls/{pollId}/results");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var results = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(results.GetProperty("totalResponses").GetInt32() > 0);
        }
    }
}
