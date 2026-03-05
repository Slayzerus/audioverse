using System.Net;
using System.Net.Http.Json;
using AudioVerse.Domain.Entities.Audio;
using AudioVerse.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace AudioVerse.Tests.Integration;

/// <summary>
/// Testy integracyjne MediaFilesController — weryfikacja prywatności plików audio.
/// </summary>
public class MediaFilesIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public MediaFilesIntegrationTests(CustomWebApplicationFactory factory) => _factory = factory;

    private HttpClient CreateUserClient(string userId = "2", string username = "user1")
    {
        var client = _factory.CreateClient();
        var token = JwtTokenHelper.GenerateToken(userId, username);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private HttpClient CreateAdminClient()
    {
        var client = _factory.CreateClient();
        var token = JwtTokenHelper.GenerateAdminToken();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private async Task SeedPrivateFile(int ownerId)
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        if (!await db.LibraryAudioFiles.AnyAsync(f => f.IsPrivate && f.OwnerId == ownerId))
        {
            db.LibraryAudioFiles.Add(new AudioFile
            {
                FileName = $"private_{ownerId}.wav",
                FilePath = $"/test/private_{ownerId}.wav",
                IsPrivate = true,
                OwnerId = ownerId
            });
            db.LibraryAudioFiles.Add(new AudioFile
            {
                FileName = "public_file.wav",
                FilePath = "/test/public_file.wav",
                IsPrivate = false,
                OwnerId = null
            });
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task ListAudioFiles_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/library/files/audio");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task ListAudioFiles_AuthUser_ReturnsOnlyPublicAndOwn()
    {
        await SeedPrivateFile(1); // admin's private file

        using var client = CreateUserClient("2", "user1");
        var response = await client.GetAsync("/api/library/files/audio");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        // User 2 should NOT see admin's private file (ownerId=1)
        Assert.DoesNotContain("private_1.wav", body);
        // User 2 should see public files
        Assert.Contains("public_file.wav", body);
    }

    [Fact]
    public async Task ListAudioFiles_Owner_SeesOwnPrivateFiles()
    {
        await SeedPrivateFile(1);

        using var client = CreateAdminClient(); // id=1
        var response = await client.GetAsync("/api/library/files/audio");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        // Admin (id=1) should see their own private file
        Assert.Contains("private_1.wav", body);
    }

    [Fact]
    public async Task GetAudioFile_PrivateFile_OtherUserGets404()
    {
        await SeedPrivateFile(1);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var privateFile = await db.LibraryAudioFiles.FirstOrDefaultAsync(f => f.IsPrivate && f.OwnerId == 1);
        if (privateFile == null) return;

        using var client = CreateUserClient("2", "user1");
        var response = await client.GetAsync($"/api/library/files/audio/{privateFile.Id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteAudioFile_PrivateFile_OtherUserGets404()
    {
        await SeedPrivateFile(1);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AudioVerseDbContext>();
        var privateFile = await db.LibraryAudioFiles.FirstOrDefaultAsync(f => f.IsPrivate && f.OwnerId == 1);
        if (privateFile == null) return;

        using var client = CreateUserClient("2", "user1");
        var response = await client.DeleteAsync($"/api/library/files/audio/{privateFile.Id}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
