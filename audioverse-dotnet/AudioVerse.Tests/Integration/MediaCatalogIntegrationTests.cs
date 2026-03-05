using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AudioVerse.Tests.Integration;

/// <summary>Integration tests for Movies, Books, TvShows, Sports controllers (Media Catalog).</summary>
public class MediaCatalogIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public MediaCatalogIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

    private HttpClient AuthClient()
    {
        var client = _factory.CreateClient();
        var token = JwtTokenHelper.GenerateToken("1", "tester");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    // ── Movies ──

    [Fact]
    public async Task Movies_GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/media/movies");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Movies_GetById_NotFound()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/media/movies/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Movies_CreateAndRead()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/media/movies", new { Title = "Test Movie", ReleaseYear = 2025 });
        Assert.True(resp.IsSuccessStatusCode, $"Create: {resp.StatusCode}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();
        Assert.True(id > 0);

        resp = await client.GetAsync($"/api/media/movies/{id}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Movies_Delete_NotFound()
    {
        var client = AuthClient();
        var resp = await client.DeleteAsync("/api/media/movies/99999");
        Assert.True(resp.StatusCode == HttpStatusCode.NotFound || resp.StatusCode == HttpStatusCode.NoContent);
    }

    // ── Books ──

    [Fact]
    public async Task Books_GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/media/books");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Books_CreateAndRead()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/media/books", new { Title = "Test Book", Author = "Author", Isbn = "978-3-16-148410-0" });
        Assert.True(resp.IsSuccessStatusCode, $"Create: {resp.StatusCode}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();

        resp = await client.GetAsync($"/api/media/books/{id}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    // ── TV Shows ──

    [Fact]
    public async Task TvShows_GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/media/tv");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task TvShows_CreateAndRead()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/media/tv", new { Title = "Test Show", FirstAirYear = 2025, Seasons = 1 });
        Assert.True(resp.IsSuccessStatusCode, $"Create: {resp.StatusCode}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();

        resp = await client.GetAsync($"/api/media/tv/{id}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    // ── Sports ──

    [Fact]
    public async Task Sports_GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/media/sports");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Sports_CreateAndRead()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/media/sports", new { Name = "Test Sport", Type = "Team" });
        Assert.True(resp.IsSuccessStatusCode, $"Create: {resp.StatusCode}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();

        resp = await client.GetAsync($"/api/media/sports/{id}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
