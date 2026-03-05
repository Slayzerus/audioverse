using System.Net;
using Xunit;

namespace AudioVerse.Tests.Integration;

/// <summary>Integration tests for AI Audio and AI Video controllers (placeholder endpoints).</summary>
public class AiControllersIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    public AiControllersIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

    private HttpClient AuthClient()
    {
        var client = _factory.CreateClient();
        var token = JwtTokenHelper.GenerateToken("1", "tester");
        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    [Fact]
    public async Task AiAudio_Transcribe_Returns503_WhenNotConfigured()
    {
        var client = AuthClient();
        var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(new byte[] { 0 }), "file", "test.wav");
        var resp = await client.PostAsync("/api/ai/audio/transcribe", content);
        // 503 or 400 (no real AI backend)
        Assert.True(resp.StatusCode == HttpStatusCode.ServiceUnavailable ||
                    resp.StatusCode == HttpStatusCode.BadRequest,
                    $"Expected 503/400 but got {resp.StatusCode}");
    }

    [Fact]
    public async Task AiAudio_Unauthorized_Returns401()
    {
        var client = _factory.CreateClient();
        var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(new byte[] { 0 }), "file", "test.wav");
        var resp = await client.PostAsync("/api/ai/audio/transcribe", content);
        Assert.Equal(HttpStatusCode.Unauthorized, resp.StatusCode);
    }

    [Fact]
    public async Task AiVideo_Pose_Returns503_WhenNotConfigured()
    {
        var client = AuthClient();
        var content = new MultipartFormDataContent();
        content.Add(new ByteArrayContent(new byte[] { 0 }), "file", "test.mp4");
        var resp = await client.PostAsync("/api/ai/video/pose", content);
        Assert.True(resp.StatusCode == HttpStatusCode.ServiceUnavailable ||
                    resp.StatusCode == HttpStatusCode.BadRequest,
                    $"Expected 503/400 but got {resp.StatusCode}");
    }
}
