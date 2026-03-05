using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    public class LicenseIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public LicenseIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private HttpClient CreateAuthClient()
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", JwtTokenHelper.GenerateToken("1", "testuser"));
            return client;
        }

        [Fact]
        public async Task GetLicense_WithParams_ReturnsOk()
        {
            using var client = CreateAuthClient();
            var response = await client.GetAsync("/api/library/license?title=Yesterday&artist=Beatles");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        }

        [Fact]
        public async Task GetLicense_WithoutParams_ReturnsOkOrBadRequest()
        {
            using var client = CreateAuthClient();
            var response = await client.GetAsync("/api/library/license");
            Assert.True(response.StatusCode == HttpStatusCode.OK || response.StatusCode == HttpStatusCode.BadRequest);
        }
    }
}
