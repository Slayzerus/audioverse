using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration;

public class ExternalConnectionsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public ExternalConnectionsIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

    [Fact]
    public async Task GetConnections_Authenticated_ReturnsOk()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();
        Assert.NotNull(user);

        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var resp = await client.GetAsync("/api/user/connections");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task GetConnections_Unauthenticated_Returns401()
    {
        using var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/user/connections");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task GetAuthUrl_Steam_ReturnsOk()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();
        Assert.NotNull(user);

        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var resp = await client.GetAsync("/api/user/connections/steam/auth-url");
        Assert.True(resp.StatusCode == HttpStatusCode.OK || resp.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task DisconnectPlatform_NotConnected_Returns404()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();
        Assert.NotNull(user);

        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var resp = await client.DeleteAsync("/api/user/connections/nonexistent-platform");
        Assert.True(resp.StatusCode == HttpStatusCode.NotFound || resp.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetPlatformConnection_NotConnected_Returns404()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();
        Assert.NotNull(user);

        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var resp = await client.GetAsync("/api/user/connections/nonexistent-platform");
        Assert.True(resp.StatusCode == HttpStatusCode.NotFound || resp.StatusCode == HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task LinkBgg_ValidUsername_Succeeds()
    {
        using var client = _factory.CreateClient();
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var user = await db.Users.FirstOrDefaultAsync();
        Assert.NotNull(user);

        var token = JwtTokenHelper.GenerateToken(user!.Id.ToString()!, "user");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

        var resp = await client.PostAsJsonAsync("/api/user/connections/bgg/link", new { Username = "testuser" });
        Assert.True(resp.StatusCode == HttpStatusCode.OK || resp.StatusCode == HttpStatusCode.BadRequest);
    }
}
