using System.Net.Http.Headers;
using System.Net.Http.Json;
using AudioVerse.Tests.Integration;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    /// <summary>
    /// Integration tests for audit log endpoints and system configuration endpoints.
    /// </summary>
    public class AuditIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;

        public AuditIntegrationTests(CustomWebApplicationFactory factory)
        {
            _factory = factory;
        }

        /// <summary>
        /// Ensures user audit log endpoint returns logs for the authenticated user.
        /// </summary>
        [Fact]
        public async Task GetMyAuditLogs_ReturnsSeededUserLogs()
        {
            var client = _factory.CreateClient();
            // user1 id=2 seeded
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateToken("2", "user1"));

            var response = await client.GetAsync("/api/user/audit-logs");
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<AuditLogsResponse>();
            Assert.NotNull(payload);
            Assert.True(payload.Success);
            Assert.NotNull(payload.Logs);
            Assert.True(payload.Logs.Count >= 1);
        }

        /// <summary>
        /// Admin should be able to retrieve all audit logs.
        /// </summary>
        [Fact]
        public async Task GetAllAuditLogs_Admin_ReturnsData()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateAdminToken());

            var response = await client.GetAsync("/api/user/audit-logs/all");
            response.EnsureSuccessStatusCode();

            var payload = await response.Content.ReadFromJsonAsync<AuditLogsResponse>();
            Assert.NotNull(payload);
            Assert.True(payload.Success);
            Assert.NotNull(payload.Logs);
            Assert.True(payload.Logs.Count >= 1);
        }

        /// <summary>
        /// Admin can read and update system configuration.
        /// </summary>
        [Fact]
        public async Task Admin_Can_Get_And_Update_SystemConfig()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateAdminToken());

            // GET
            var getResponse = await client.GetAsync("/api/admin/system-config");
            getResponse.EnsureSuccessStatusCode();
            var getPayload = await getResponse.Content.ReadFromJsonAsync<SystemConfigResponse>();
            Assert.NotNull(getPayload);
            Assert.True(getPayload.Success);
            Assert.NotNull(getPayload.Configuration);

            // PUT update maxMicrophonePlayers
            var updateRequest = new
            {
                sessionTimeoutMinutes = getPayload.Configuration.SessionTimeoutMinutes,
                captchaOption = getPayload.Configuration.CaptchaOption,
                maxMicrophonePlayers = getPayload.Configuration.MaxMicrophonePlayers + 1,
                active = true
            };
            var putResponse = await client.PutAsJsonAsync("/api/admin/system-config", updateRequest);
            putResponse.EnsureSuccessStatusCode();
            var putPayload = await putResponse.Content.ReadFromJsonAsync<SimpleResponse>();
            Assert.NotNull(putPayload);
            Assert.True(putPayload.Success);
        }

        /// <summary>
        /// DTO for audit logs responses.
        /// </summary>
        private class AuditLogsResponse
        {
            public bool Success { get; set; }
            public List<object>? Logs { get; set; }
        }

        /// <summary>
        /// DTO for system configuration responses.
        /// </summary>
        private class SystemConfigResponse
        {
            public bool Success { get; set; }
            public ConfigDto Configuration { get; set; } = new();
        }

        /// <summary>
        /// DTO representing system configuration.
        /// </summary>
        private class ConfigDto
        {
            public int SessionTimeoutMinutes { get; set; }
            public int CaptchaOption { get; set; }
            public int MaxMicrophonePlayers { get; set; }
        }

        /// <summary>
        /// DTO for simple success responses.
        /// </summary>
        private class SimpleResponse
        {
            public bool Success { get; set; }
        }
    }
}
