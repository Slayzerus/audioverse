using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AudioVerse.Tests.Integration;

/// <summary>Integration tests for Soundfonts CRUD and file management.</summary>
public class SoundfontIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public SoundfontIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

    private HttpClient AuthClient()
    {
        var client = _factory.CreateClient();
        var token = JwtTokenHelper.GenerateToken("1", "tester");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/library/soundfonts");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task GetById_NotFound()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/library/soundfonts/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task CreateAndRead()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/library/soundfonts", new
        {
            Name = "FluidR3 GM",
            Description = "General MIDI soundfont",
            Format = 0,
            Author = "Frank Wen",
            Version = "3.0",
            License = "MIT",
            PresetCount = 128,
            Tags = "gm,piano,strings,brass"
        });
        Assert.True(resp.IsSuccessStatusCode, $"Create: {resp.StatusCode}");
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();
        Assert.True(id > 0);

        resp = await client.GetAsync($"/api/library/soundfonts/{id}");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("FluidR3 GM", body.GetProperty("name").GetString());
        Assert.Equal(128, body.GetProperty("presetCount").GetInt32());
    }

    [Fact]
    public async Task UpdateAndVerify()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/library/soundfonts", new
        {
            Name = "Update Test SF",
            Format = 0
        });
        Assert.True(resp.IsSuccessStatusCode);
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();

        resp = await client.PutAsJsonAsync($"/api/library/soundfonts/{id}", new
        {
            Name = "Updated SF Name",
            Author = "New Author",
            Format = 2,
            Tags = "sfz,piano"
        });
        Assert.True(resp.IsSuccessStatusCode, $"Update: {resp.StatusCode}");

        resp = await client.GetAsync($"/api/library/soundfonts/{id}");
        body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Updated SF Name", body.GetProperty("name").GetString());
    }

    [Fact]
    public async Task Delete_NotFound()
    {
        var client = AuthClient();
        var resp = await client.DeleteAsync("/api/library/soundfonts/99999");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task GetFiles_EmptyList()
    {
        var client = AuthClient();
        var resp = await client.PostAsJsonAsync("/api/library/soundfonts", new { Name = "EmptyFiles SF", Format = 0 });
        var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetInt32();

        resp = await client.GetAsync($"/api/library/soundfonts/{id}/files");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/api/library/soundfonts");
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task Search_ByQuery()
    {
        var client = AuthClient();
        await client.PostAsJsonAsync("/api/library/soundfonts", new { Name = "SearchableFont Piano", Format = 0, Tags = "piano" });

        var resp = await client.GetAsync("/api/library/soundfonts?query=Piano");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task Search_ByFormat()
    {
        var client = AuthClient();
        await client.PostAsJsonAsync("/api/library/soundfonts", new { Name = "SFZ Format Test", Format = 2 });

        var resp = await client.GetAsync("/api/library/soundfonts?format=2");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }
}
