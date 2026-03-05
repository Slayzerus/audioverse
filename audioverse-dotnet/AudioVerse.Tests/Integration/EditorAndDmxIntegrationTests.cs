using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;

namespace AudioVerse.Tests.Integration
{
    public class EditorAndDmxIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public EditorAndDmxIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private HttpClient AuthClient()
        {
            var client = _factory.CreateClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var party = db.Events.First();
            var token = JwtTokenHelper.GenerateToken(party.OrganizerId!.Value.ToString(), "organizer");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        // ?? Audio Effects ??

        [Fact]
        public async Task Effects_CRUD()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/editor/effects", new { Name = "Reverb Hall", Type = 0, ParametersJson = "{\"size\":0.8}" });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync("/api/editor/effects");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var effects = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(effects.GetArrayLength() > 0);
        }

        // ?? Project Collaborators ??

        [Fact]
        public async Task Collaborators_CRUD()
        {
            var client = AuthClient();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var project = await db.AudioProjects.FirstOrDefaultAsync();
            if (project == null) return; // skip if no projects seeded

            var resp = await client.PostAsJsonAsync($"/api/editor/project/{project.Id}/collaborators", new { UserId = 2, Permission = 1 });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync($"/api/editor/project/{project.Id}/collaborators");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? Export Task ??

        [Fact]
        public async Task Export_CreateAndCheckStatus()
        {
            var client = AuthClient();

            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
            var project = await db.AudioProjects.FirstOrDefaultAsync();
            if (project == null) return;

            var resp = await client.PostAsync($"/api/editor/project/{project.Id}/export", null);
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var taskId = body.GetProperty("taskId").GetInt32();

            // Wait briefly for background task
            await Task.Delay(1000);

            resp = await client.GetAsync($"/api/editor/export/{taskId}/status");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? DMX Scenes ??

        [Fact]
        public async Task DmxScenes_CRUD_And_Apply()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/dmx/scenes", new { Name = "Warm Glow", ChannelValuesJson = "{\"1\":255,\"2\":128}" });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync("/api/dmx/scenes");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var scenes = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(scenes.GetArrayLength() > 0);

            var sceneId = scenes[0].GetProperty("id").GetInt32();

            resp = await client.PostAsync($"/api/dmx/scenes/{sceneId}/apply", null);
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? DMX Sequences ??

        [Fact]
        public async Task DmxSequences_CRUD()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/dmx/sequences", new { Name = "Event Loop", Loop = true, Steps = new object[0] });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync("/api/dmx/sequences");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? Health Check ??

        [Fact]
        public async Task HealthCheck_ReturnsHealthy()
        {
            var client = _factory.CreateClient();
            var resp = await client.GetAsync("/health");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }
    }
}
