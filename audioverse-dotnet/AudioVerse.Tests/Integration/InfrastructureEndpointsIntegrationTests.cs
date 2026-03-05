using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AudioVerse.Tests.Integration;

/// <summary>Integration tests for soft delete, restore, health check, and audit endpoints.</summary>
public class InfrastructureEndpointsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public InfrastructureEndpointsIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

    private HttpClient AuthClient()
    {
        var client = _factory.CreateClient();
        var token = JwtTokenHelper.GenerateAdminToken();
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task HealthCheck_Returns200()
    {
        var client = _factory.CreateClient();
        var resp = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task AuditLog_GetAll_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/admin/audit");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task AuditLog_FilterByEntity_Returns200()
    {
        var client = AuthClient();
        var resp = await client.GetAsync("/api/admin/audit?entity=Event&entityId=1");
        Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
    }

    [Fact]
    public async Task SoftDelete_NotFound_For_NonExistentEvent()
    {
        var client = AuthClient();
        var resp = await client.DeleteAsync("/api/events/99999/soft");
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task Restore_NotFound_For_NonExistentEvent()
    {
        var client = AuthClient();
        var resp = await client.PostAsync("/api/events/99999/restore", null);
        Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
    }

    [Fact]
    public async Task SoftDelete_And_Restore_Flow()
    {
        var client = AuthClient();

        // Create an event first
        var createResp = await client.PostAsJsonAsync("/api/events", new
        {
            Title = "SoftDeleteTest",
            StartTime = DateTime.UtcNow.AddDays(7),
            Type = 0
        });
        Assert.True(createResp.IsSuccessStatusCode, $"Create event: {createResp.StatusCode}");
        var body = await createResp.Content.ReadFromJsonAsync<JsonElement>();
        int eventId;
        if (body.TryGetProperty("id", out var idProp))
            eventId = idProp.GetInt32();
        else
            eventId = body.GetProperty("eventId").GetInt32();

        // Soft delete
        var deleteResp = await client.DeleteAsync($"/api/events/{eventId}/soft");
        Assert.True(deleteResp.StatusCode == HttpStatusCode.NoContent || deleteResp.StatusCode == HttpStatusCode.OK);

        // Restore
        var restoreResp = await client.PostAsync($"/api/events/{eventId}/restore", null);
        Assert.True(restoreResp.IsSuccessStatusCode, $"Restore: {restoreResp.StatusCode}");
    }
}
