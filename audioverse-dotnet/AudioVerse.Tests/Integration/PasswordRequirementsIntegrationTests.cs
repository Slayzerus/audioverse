using System.Net;
using System.Net.Http.Headers;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    public class PasswordRequirementsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public PasswordRequirementsIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private HttpClient CreateClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateToken("1", "testuser"));
            return client;
        }

        [Fact]
        public async Task GetPasswordRequirements_ReturnsOkOrNotFound()
        {
            using var client = CreateClient();
            var response = await client.GetAsync("/api/password-requirements");
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.NotFound);
        }
    }
}
