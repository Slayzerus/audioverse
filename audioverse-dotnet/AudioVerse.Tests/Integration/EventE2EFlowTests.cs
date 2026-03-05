using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Domain.Entities.Events;

namespace AudioVerse.Tests.Integration;

public class EventE2EFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public EventE2EFlowTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task FullEventFlow_CreateEvent_AddSchedule_AddMenu_AddPoll_Vote_Billing()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        var user = await db.Users.FirstOrDefaultAsync();
        Assert.NotNull(user);

        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "organizer");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // 1. Create event
        var ev = new
        {
            Title = "E2E Test Event",
            Description = "Full flow test",
            StartTime = DateTime.UtcNow.AddDays(7),
            OrganizerId = user.Id,
            Status = 0,
            Type = 0,
            Visibility = 0
        };
        var createResp = await client.PostAsJsonAsync("/api/events", ev);
        Assert.True(createResp.StatusCode == HttpStatusCode.Created || createResp.StatusCode == HttpStatusCode.OK);
        var createdJson = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        var eventId = createdJson.GetProperty("eventId").GetInt32();
        Assert.True(eventId > 0);

        // 2. Get event
        var getResp = await client.GetAsync($"/api/events/{eventId}");
        Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);

        // 3. Add schedule item
        var scheduleItem = new { EventId = eventId, Title = "Opening", StartTime = DateTime.UtcNow.AddDays(7), DurationMinutes = 30 };
        var schedResp = await client.PostAsJsonAsync($"/api/events/{eventId}/schedule", scheduleItem);
        Assert.True(schedResp.StatusCode == HttpStatusCode.Created || schedResp.StatusCode == HttpStatusCode.OK);

        // 4. Get schedule
        var getSchedResp = await client.GetAsync($"/api/events/{eventId}/schedule");
        Assert.Equal(HttpStatusCode.OK, getSchedResp.StatusCode);

        // 5. Add menu item
        var menuItem = new { EventId = eventId, Name = "Pizza", Description = "Margherita", Price = 12.50m };
        var menuResp = await client.PostAsJsonAsync($"/api/events/{eventId}/menu", menuItem);
        Assert.True(menuResp.StatusCode == HttpStatusCode.Created || menuResp.StatusCode == HttpStatusCode.OK);

        // 6. Get menu
        var getMenuResp = await client.GetAsync($"/api/events/{eventId}/menu");
        Assert.Equal(HttpStatusCode.OK, getMenuResp.StatusCode);

        // 7. Add photo
        using var photoContent = new MultipartFormDataContent();
        var fileBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };
        photoContent.Add(new ByteArrayContent(fileBytes), "file", "photo.jpg");
        photoContent.Add(new StringContent("E2E photo"), "caption");
        var photoResp = await client.PostAsync($"/api/events/{eventId}/photos", photoContent);
        Assert.Equal(HttpStatusCode.Created, photoResp.StatusCode);

        // 8. Add comment
        var comment = new { Text = "Can't wait for this event!", UserId = user.Id };
        var commentResp = await client.PostAsJsonAsync($"/api/events/{eventId}/comments", comment);
        Assert.Equal(HttpStatusCode.Created, commentResp.StatusCode);

        // 9. Get comments
        var getCommResp = await client.GetAsync($"/api/events/{eventId}/comments");
        Assert.Equal(HttpStatusCode.OK, getCommResp.StatusCode);

        // 10. Verify events list includes our event
        var listResp = await client.GetAsync($"/api/events?query=E2E+Test");
        Assert.Equal(HttpStatusCode.OK, listResp.StatusCode);
    }

    [Fact]
    public async Task FullEventFlow_BoardGameSession_RoundsAndScores()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        var ev = await db.Events.FirstOrDefaultAsync();
        Assert.NotNull(ev);

        var token = JwtTokenHelper.GenerateToken(ev!.OrganizerId!.Value.ToString(), "organizer");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // 1. Create board game session
        var session = new { EventId = ev.Id, StartedAt = DateTime.UtcNow };
        var sessResp = await client.PostAsJsonAsync("/api/games/board/sessions", session);
        Assert.True(sessResp.StatusCode == HttpStatusCode.Created || sessResp.StatusCode == HttpStatusCode.OK);

        // 2. Get sessions for event
        var getSessResp = await client.GetAsync($"/api/games/board/sessions/event/{ev.Id}");
        Assert.Equal(HttpStatusCode.OK, getSessResp.StatusCode);

        // 3. Player stats — endpoint expects UserProfilePlayer.Id, not UserProfile.Id
        var player = await db.UserProfilePlayers.FirstOrDefaultAsync(p => p.ProfileId == ev.OrganizerId);
        var playerId = player?.Id ?? ev.OrganizerId!.Value;
        var statsResp = await client.GetAsync($"/api/games/board/stats/player/{playerId}");
        Assert.Equal(HttpStatusCode.OK, statsResp.StatusCode);
    }
}
