using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration;

public class EventPhotosCommentsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public EventPhotosCommentsIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<(System.Net.Http.HttpClient client, int eventId)> SetupAsync()
    {
        var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var ev = await db.Events.FirstOrDefaultAsync();
        Assert.NotNull(ev);
        var token = JwtTokenHelper.GenerateToken(ev!.OrganizerId!.Value.ToString(), "organizer");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return (client, ev.Id);
    }

    [Fact]
    public async Task GetPhotos_Empty_ReturnsOk()
    {
        var (client, eventId) = await SetupAsync();
        var resp = await client.GetAsync($"/api/events/{eventId}/photos");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task AddPhoto_ReturnsCreated()
    {
        var (client, eventId) = await SetupAsync();
        using var content = new MultipartFormDataContent();
        var fileBytes = new byte[] { 0xFF, 0xD8, 0xFF, 0xE0 };
        content.Add(new ByteArrayContent(fileBytes), "file", "test.jpg");
        content.Add(new StringContent("Test photo"), "caption");
        var resp = await client.PostAsync($"/api/events/{eventId}/photos", content);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
    }

    [Fact]
    public async Task DeletePhoto_NonExistent_Returns404()
    {
        var (client, eventId) = await SetupAsync();
        var resp = await client.DeleteAsync($"/api/events/{eventId}/photos/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task GetComments_Empty_ReturnsOk()
    {
        var (client, eventId) = await SetupAsync();
        var resp = await client.GetAsync($"/api/events/{eventId}/comments");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task AddComment_ReturnsCreated()
    {
        var (client, eventId) = await SetupAsync();
        var comment = new { Text = "Great event!", UserId = 1 };
        var resp = await client.PostAsJsonAsync($"/api/events/{eventId}/comments", comment);
        Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
    }

    [Fact]
    public async Task AddReply_ReturnsCreated()
    {
        var (client, eventId) = await SetupAsync();

        var comment = new { Text = "Parent comment", UserId = 1 };
        var createResp = await client.PostAsJsonAsync($"/api/events/{eventId}/comments", comment);
        Assert.Equal(HttpStatusCode.Created, createResp.StatusCode);
        var created = await createResp.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        var parentId = created.GetProperty("id").GetInt32();

        var reply = new { Text = "Reply to parent", UserId = 2, ParentId = parentId };
        var replyResp = await client.PostAsJsonAsync($"/api/events/{eventId}/comments", reply);
        Assert.Equal(HttpStatusCode.Created, replyResp.StatusCode);
    }

    [Fact]
    public async Task DeleteComment_NonExistent_Returns404()
    {
        var (client, eventId) = await SetupAsync();
        var resp = await client.DeleteAsync($"/api/events/{eventId}/comments/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }
}
