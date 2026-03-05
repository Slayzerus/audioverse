using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration;

public class AudioEditorIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public AudioEditorIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

    private async Task<(System.Net.Http.HttpClient client, string token)> AuthenticatedClient()
    {
        var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();
        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return (client, token);
    }

    [Fact]
    public async Task GetProjects_Authenticated_ReturnsOk()
    {
        var (client, _) = await AuthenticatedClient();
        var resp = await client.GetAsync("/api/audio-editor/projects");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task GetProjects_Unauthenticated_ReturnsUnauthorized()
    {
        using var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/audio-editor/projects");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task CreateProject_ReturnsCreated()
    {
        var (client, _) = await AuthenticatedClient();
        var project = new { Name = "Test Project", Description = "Integration test", Bpm = 120 };
        var resp = await client.PostAsJsonAsync("/api/audio-editor/projects", project);
        Assert.True(resp.StatusCode == HttpStatusCode.Created || resp.StatusCode == HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetProject_NonExistent_Returns404()
    {
        var (client, _) = await AuthenticatedClient();
        var resp = await client.GetAsync("/api/audio-editor/projects/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task UpdateProject_NonExistent_Returns404()
    {
        var (client, _) = await AuthenticatedClient();
        var project = new { Name = "Updated", Description = "Updated desc", Bpm = 130 };
        var resp = await client.PutAsJsonAsync("/api/audio-editor/projects/99999", project);
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task DeleteTrack_NonExistent_Returns404()
    {
        var (client, _) = await AuthenticatedClient();
        var resp = await client.DeleteAsync("/api/audio-editor/projects/99999/tracks/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }
}
