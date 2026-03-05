using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AudioVerse.Tests.Integration;

/// <summary>Integration tests for Organizations, Leagues, Fantasy, and Betting controllers.</summary>
public class LeagueAndBettingIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public LeagueAndBettingIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

    private HttpClient AuthClient()
    {
        var client = _factory.CreateClient();
        var token = JwtTokenHelper.GenerateAdminToken();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // ── Organizations ──

    [Fact]
    public async Task Organizations_GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/organizations");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Organizations_CreateAndRead()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/organizations", new { Name = "Test Org", Description = "Test" });
        Assert.True(resp.IsSuccessStatusCode, $"Create org: {resp.StatusCode}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();

        resp = await client.GetAsync($"/api/organizations/{id}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    // ── Leagues ──

    [Fact]
    public async Task Leagues_GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/leagues");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Leagues_CreateAndRead()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/leagues", new { Name = "Test League", Type = 0, Description = "Test league" });
        Assert.True(resp.IsSuccessStatusCode, $"Create league: {resp.StatusCode}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();

        resp = await client.GetAsync($"/api/leagues/{id}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Leagues_GetById_NotFound()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/leagues/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    // ── Betting ──

    [Fact]
    public async Task Betting_GetUserBets_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/betting/users/999/bets");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Betting_GetUserWallet_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/betting/users/999/wallet");
        Assert.True(resp.StatusCode == HttpStatusCode.OK || resp.StatusCode == HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task Betting_GetEventMarkets_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/betting/events/1/markets");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Betting_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/betting/users/1/bets");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }
}
