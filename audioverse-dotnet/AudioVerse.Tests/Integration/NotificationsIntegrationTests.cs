using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration;

public class NotificationsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public NotificationsIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<System.Net.Http.HttpClient> AuthClient()
    {
        var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();
        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task GetNotifications_Authenticated_ReturnsOk()
    {
        var client = await AuthClient();
        var resp = await client.GetAsync("/api/user/notifications");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task GetNotifications_Unauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/user/notifications");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task GetUnreadCount_ReturnsOk()
    {
        var client = await AuthClient();
        var resp = await client.GetAsync("/api/user/notifications/unread-count");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task SendNotification_ReturnsCreated()
    {
        var client = await AuthClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();

        var notification = new { UserId = user!.Id, Title = "Test", Body = "Test notification", Type = 0 };
        var resp = await client.PostAsJsonAsync("/api/user/notifications", notification);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
    }

    [Fact]
    public async Task MarkAsRead_NonExistent_Returns404()
    {
        var client = await AuthClient();
        var resp = await client.PostAsync("/api/user/notifications/99999/read", null);
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task MarkAllAsRead_ReturnsOk()
    {
        var client = await AuthClient();
        var resp = await client.PostAsync("/api/user/notifications/read-all", null);
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task DeleteNotification_NonExistent_Returns404()
    {
        var client = await AuthClient();
        var resp = await client.DeleteAsync("/api/user/notifications/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }
}
