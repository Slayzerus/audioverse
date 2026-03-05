using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using AudioVerse.Infrastructure.Persistence;
using AudioVerse.Domain.Entities.Audio;

namespace AudioVerse.Tests.Integration
{
    public class GenresAdminIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public GenresAdminIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private HttpClient CreateAdminClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateAdminToken());
            return client;
        }

        [Fact]
        public async Task GetAllGenres_ReturnsOk()
        {
            using var client = CreateAdminClient();
            var response = await client.GetAsync("/api/admin/genres");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task CreateAndGetGenre_RoundTrip()
        {
            using var client = CreateAdminClient();

            var genre = new { Name = "TestGenre_" + Guid.NewGuid().ToString("N")[..6] };
            var createResponse = await client.PostAsJsonAsync("/api/admin/genres", genre);
            Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);

            var created = await createResponse.Content.ReadFromJsonAsync<IdResponse>();
            Assert.NotNull(created);
            Assert.True(created!.Id > 0);

            var getResponse = await client.GetAsync($"/api/admin/genres/{created.Id}");
            Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        }

        [Fact]
        public async Task UpdateGenre_ReturnsOk()
        {
            using var client = CreateAdminClient();
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();

            var existing = await db.MusicGenres.FirstOrDefaultAsync();
            if (existing == null)
            {
                db.MusicGenres.Add(new MusicGenre { Name = "UpdateTest" });
                await db.SaveChangesAsync();
                existing = await db.MusicGenres.FirstAsync();
            }

            var updated = new { Name = "Updated_" + Guid.NewGuid().ToString("N")[..6] };
            var response = await client.PutAsJsonAsync($"/api/admin/genres/{existing.Id}", updated);
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task DeleteGenre_ReturnsOk()
        {
            using var client = CreateAdminClient();

            var genre = new { Name = "ToDelete_" + Guid.NewGuid().ToString("N")[..6] };
            var createResponse = await client.PostAsJsonAsync("/api/admin/genres", genre);
            var created = await createResponse.Content.ReadFromJsonAsync<IdResponse>();

            var deleteResponse = await client.DeleteAsync($"/api/admin/genres/{created!.Id}");
            Assert.True(deleteResponse.IsSuccessStatusCode);
        }

        [Fact]
        public async Task GetNonexistentGenre_ReturnsNotFound()
        {
            using var client = CreateAdminClient();
            var response = await client.GetAsync("/api/admin/genres/999999");
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        private record IdResponse(int Id);
    }
}
