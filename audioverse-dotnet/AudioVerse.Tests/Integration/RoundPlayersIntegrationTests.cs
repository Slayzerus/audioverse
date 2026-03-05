using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using AudioVerse.Tests.Integration;
using System.Threading.Tasks;
using System.Net;
using AudioVerse.Application.Models.Requests.Karaoke;
using AudioVerse.Application.Models.Dtos;

namespace AudioVerse.Tests.Integration
{
    public class RoundPlayersIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public RoundPlayersIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        [Fact]
        public async Task Create_Get_Delete_RoundPlayer_Flow_AsOwner()
        {
            using var client = _factory.CreateClient();

            // Seeded user and auth helper
            var token = JwtTokenHelper.GenerateTokenForTestUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            // assume there is a round with id 1 and a user-owned player with id 1 (TestDataSeeder should create these)
            var req = new AddRoundPlayerRequest { PlayerId = 1, Slot = 1 };
            var postResp = await client.PostAsJsonAsync($"/api/karaoke/rounds/1/players", req);
            Assert.True(postResp.IsSuccessStatusCode);
            var postBody = await postResp.Content.ReadFromJsonAsync<JsonElement>();
            int id = postBody.GetProperty("id").GetInt32();

            // GET
            var getResp = await client.GetAsync($"/api/karaoke/rounds/1/players");
            Assert.Equal(HttpStatusCode.OK, getResp.StatusCode);
            var list = await getResp.Content.ReadFromJsonAsync<KaraokeRoundPlayerDto[]>();
            Assert.Contains(list!, x => x.Id == id);

            // DELETE
            var delResp = await client.DeleteAsync($"/api/karaoke/rounds/1/players/{id}");
            Assert.True(delResp.StatusCode == HttpStatusCode.NoContent || delResp.StatusCode == HttpStatusCode.OK);
        }

        [Fact]
        public async Task Delete_By_NonOwner_Should_Forbidden()
        {
            using var client = _factory.CreateClient();
            // token for other user
            var token = JwtTokenHelper.GenerateTokenForAnotherUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

            // create assignment as owner first
            var ownerToken = JwtTokenHelper.GenerateTokenForTestUser();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", ownerToken);
            var req = new AddRoundPlayerRequest { PlayerId = 1, Slot = 2 };
            var postResp = await client.PostAsJsonAsync($"/api/karaoke/rounds/1/players", req);
            var postBody = await postResp.Content.ReadFromJsonAsync<JsonElement>();
            int id = postBody.GetProperty("id").GetInt32();

            // try delete as other user
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var delResp = await client.DeleteAsync($"/api/karaoke/rounds/1/players/{id}");
            Assert.Equal(HttpStatusCode.Forbidden, delResp.StatusCode);
        }
    }
}
