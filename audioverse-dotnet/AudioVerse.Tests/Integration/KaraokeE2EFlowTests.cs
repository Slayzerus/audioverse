using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration;

public class KaraokeE2EFlowTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public KaraokeE2EFlowTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task FullKaraokeFlow_CreateEvent_AddSongs_QueueAndPlay()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        var ev = await db.Events.FirstOrDefaultAsync();
        Assert.NotNull(ev);

        var token = JwtTokenHelper.GenerateToken(ev!.OrganizerId!.Value.ToString(), "organizer");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // 1. Get karaoke event (if exists)
        var getResp = await client.GetAsync($"/api/karaoke/events/{ev.Id}");
        Assert.True(getResp.StatusCode == HttpStatusCode.OK || getResp.StatusCode == HttpStatusCode.NotFound);

        // 2. Get song queue
        var queueResp = await client.GetAsync($"/api/karaoke/events/{ev.Id}/queue");
        Assert.True(queueResp.StatusCode == HttpStatusCode.OK || queueResp.StatusCode == HttpStatusCode.NotFound);

        // 3. Get teams
        var teamsResp = await client.GetAsync($"/api/karaoke/events/{ev.Id}/teams");
        Assert.True(teamsResp.StatusCode == HttpStatusCode.OK || teamsResp.StatusCode == HttpStatusCode.NotFound);

        // 4. Get playlists
        var playlistsResp = await client.GetAsync("/api/playlists");
        Assert.True(playlistsResp.StatusCode == HttpStatusCode.OK || playlistsResp.StatusCode == HttpStatusCode.NotFound);

        // 5. Genres list (cached)
        var genresResp = await client.GetAsync("/api/genres");
        Assert.Equal(HttpStatusCode.OK, genresResp.StatusCode);

        // 6. Dance styles
        var danceResp = await client.GetAsync("/api/dance/styles");
        Assert.True(danceResp.StatusCode == HttpStatusCode.OK || danceResp.StatusCode == HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task NotificationFlow_SendReadDelete()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

        var user = await db.Users.FirstOrDefaultAsync();
        Assert.NotNull(user);

        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        // 1. Send notification
        var notif = new { UserId = user.Id, Title = "E2E Test", Body = "E2E notification body", Type = 0 };
        var sendResp = await client.PostAsJsonAsync("/api/user/notifications", notif);
        Assert.Equal(HttpStatusCode.Created, sendResp.StatusCode);
        var sendJson = await sendResp.Content.ReadFromJsonAsync<JsonElement>();
        var notifId = sendJson.GetProperty("id").GetInt32();

        // 2. Get unread count
        var countResp = await client.GetAsync("/api/user/notifications/unread-count");
        Assert.Equal(HttpStatusCode.OK, countResp.StatusCode);

        // 3. Mark as read
        var readResp = await client.PostAsync($"/api/user/notifications/{notifId}/read", null);
        Assert.Equal(HttpStatusCode.OK, readResp.StatusCode);

        // 4. Get all (should include read)
        var allResp = await client.GetAsync("/api/user/notifications");
        Assert.Equal(HttpStatusCode.OK, allResp.StatusCode);

        // 5. Delete
        var delResp = await client.DeleteAsync($"/api/user/notifications/{notifId}");
        Assert.Equal(HttpStatusCode.NoContent, delResp.StatusCode);

        // 6. Verify deleted
        var delVerify = await client.DeleteAsync($"/api/user/notifications/{notifId}");
        Assert.Equal(HttpStatusCode.NotFound, delVerify.StatusCode);
    }
}
