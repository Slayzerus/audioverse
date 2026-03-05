using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    public class ModerationIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public ModerationIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private HttpClient CreateAdminClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateAdminToken());
            return client;
        }

        [Fact]
        public async Task SubmitReport_ReturnsOk()
        {
            using var client = CreateAdminClient();
            var report = new
            {
                ReporterUserId = 1,
                ReportedUserId = 2,
                Reason = "Test report",
                Category = "Spam"
            };
            var response = await client.PostAsJsonAsync("/api/moderation/report", report);
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.Created);
        }

        [Fact]
        public async Task AdminGetReports_ReturnsOk()
        {
            using var client = CreateAdminClient();
            var response = await client.GetAsync("/api/moderation/admin/reports");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task ResolveNonexistentReport_ReturnsNotFound()
        {
            using var client = CreateAdminClient();
            var body = new { Resolved = true, ModeratorComment = "ok" };
            var response = await client.PutAsJsonAsync("/api/moderation/admin/report/999999/resolve", body);
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
