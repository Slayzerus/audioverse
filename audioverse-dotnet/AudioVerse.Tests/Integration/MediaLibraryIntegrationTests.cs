using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace AudioVerse.Tests.Integration
{
    public class MediaLibraryIntegrationTests : IClassFixture<CustomWebApplicationFactory>
    {
        private readonly CustomWebApplicationFactory _factory;
        public MediaLibraryIntegrationTests(CustomWebApplicationFactory factory) { _factory = factory; }

        private HttpClient AuthClient()
        {
            var client = _factory.CreateClient();
            var token = JwtTokenHelper.GenerateToken("1", "tester");
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            return client;
        }

        // ?? Song CRUD ??

        [Fact]
        public async Task Song_CreateAndRead()
        {
            var client = AuthClient();

            // Create artist first
            var resp = await client.PostAsJsonAsync("/api/library/artists", new { Name = "Test Artist ML" });
            Assert.True(resp.IsSuccessStatusCode, $"Create artist: {resp.StatusCode}");
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var artistId = body.GetProperty("id").GetInt32();

            // Create album
            resp = await client.PostAsJsonAsync("/api/library/albums", new { Title = "Test Album ML", ReleaseYear = 2025, PrimaryArtistId = artistId });
            Assert.True(resp.IsSuccessStatusCode, $"Create album: {resp.StatusCode}");
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var albumId = body.GetProperty("id").GetInt32();

            // Create song
            resp = await client.PostAsJsonAsync("/api/library/songs", new { Title = "Test Song ML", AlbumId = albumId, PrimaryArtistId = artistId, ISRC = "USRC12345678" });
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var songId = body.GetProperty("id").GetInt32();
            Assert.True(songId > 0);

            // Get song
            resp = await client.GetAsync($"/api/library/songs/{songId}");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("Test Song ML", body.GetProperty("title").GetString());

            // Search
            resp = await client.GetAsync("/api/library/songs?q=Test");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(body.GetProperty("totalCount").GetInt32() > 0);

            // Delete
            resp = await client.DeleteAsync($"/api/library/songs/{songId}");
            Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode);
        }

        // ?? Album + AlbumArtist ??

        [Fact]
        public async Task Album_CreateWithArtist()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/library/artists", new { Name = "Album Artist ML" });
            Assert.True(resp.IsSuccessStatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var artistId = body.GetProperty("id").GetInt32();

            resp = await client.PostAsJsonAsync("/api/library/albums", new { Title = "ML Album", ReleaseYear = 2024 });
            Assert.True(resp.IsSuccessStatusCode);
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var albumId = body.GetProperty("id").GetInt32();

            // Add artist to album
            resp = await client.PostAsJsonAsync($"/api/library/albums/{albumId}/artists", new { ArtistId = artistId, Role = 1, Order = 0 });
            Assert.True(resp.IsSuccessStatusCode, $"Add artist to album: {resp.StatusCode} - {await resp.Content.ReadAsStringAsync()}");

            // Verify
            resp = await client.GetAsync($"/api/library/albums/{albumId}");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? Artist + Facts ??

        [Fact]
        public async Task Artist_CreateWithFacts()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/library/artists", new { Name = "Facts Artist ML" });
            Assert.True(resp.IsSuccessStatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var artistId = body.GetProperty("id").GetInt32();

            // Add fact
            resp = await client.PostAsJsonAsync($"/api/library/artists/{artistId}/facts", new { Type = 5, Value = "DJ Shadow" });
            Assert.True(resp.IsSuccessStatusCode);

            // Get facts
            resp = await client.GetAsync($"/api/library/artists/{artistId}/facts");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var facts = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(facts.GetArrayLength() > 0);

            // Upsert detail
            resp = await client.PutAsJsonAsync($"/api/library/artists/{artistId}/detail", new { Bio = "Test bio", Country = "PL" });
            Assert.True(resp.IsSuccessStatusCode);
        }

        // ?? Audio Files ??

        [Fact]
        public async Task AudioFile_CreateAndList()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/library/files/audio", new { FilePath = "/music/test.flac", FileName = "test.flac", SampleRate = 44100, Channels = 2, Size = 5000000L });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync("/api/library/files/audio");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? Song Details ??

        [Fact]
        public async Task SongDetail_AddAndRemove()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/library/songs", new { Title = "Detail Song ML" });
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var songId = body.GetProperty("id").GetInt32();

            // Add detail
            resp = await client.PostAsJsonAsync($"/api/library/songs/{songId}/details", new { Type = 4, Value = "Lyrics here..." });
            Assert.True(resp.IsSuccessStatusCode);
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var detailId = body.GetProperty("id").GetInt32();

            // List details
            resp = await client.GetAsync($"/api/library/songs/{songId}/details");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);

            // Delete detail
            resp = await client.DeleteAsync($"/api/library/songs/details/{detailId}");
            Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode);
        }

        // ?? External import ??

        [Fact]
        public async Task Import_ExternalTrack_CreatesArtistAndSong()
        {
            var client = AuthClient();
            var resp = await client.PostAsJsonAsync("/api/library/external/import", new
            {
                ExternalId = "abc123",
                Source = "Spotify",
                Title = "Imported Track",
                Artist = "Imported Artist",
                ISRC = "USRC99999999"
            });
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(body.GetProperty("songId").GetInt32() > 0);
            Assert.True(body.GetProperty("artistId").GetInt32() > 0);
        }

        // ?? Ultrastar convert ??

        [Fact]
        public async Task Ultrastar_ConvertLrc_ReturnsPath()
        {
            var client = AuthClient();
            var resp = await client.PostAsJsonAsync("/api/karaoke/ultrastar/convert/lrc", new
            {
                Artist = "Test Artist",
                Title = "Test Song",
                LrcContent = "[00:01.00]Hello world\n[00:05.00]Second line"
            });
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.True(body.GetProperty("success").GetBoolean());
        }

        // ?? Download endpoint accessible ??

        [Fact]
        public async Task Download_Audio_RequiresUrl()
        {
            var client = AuthClient();
            var resp = await client.PostAsJsonAsync("/api/library/download/audio", new { Url = "" });
            // Empty URL should fail gracefully
            Assert.True(resp.StatusCode == HttpStatusCode.OK || resp.StatusCode == HttpStatusCode.BadRequest);
        }

        // ?? License lookup endpoint accessible ??

        [Fact]
        public async Task License_Lookup_Returns()
        {
            var client = AuthClient();
            var resp = await client.GetAsync("/api/library/license?title=Test&artist=Test");
            // Should return OK even with no results (empty array)
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? MediaFile CRUD ??

        [Fact]
        public async Task MediaFile_CreateAndList()
        {
            var client = AuthClient();
            var resp = await client.PostAsJsonAsync("/api/library/files/media", new
            {
                FilePath = "/video/test.mp4",
                FileName = "test.mp4",
                FileSizeBytes = 12000000L,
                MimeType = "video/mp4"
            });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync("/api/library/files/media");
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        // ?? Song update + delete ??

        [Fact]
        public async Task Song_UpdateAndDelete()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/library/songs", new { Title = "Update Me" });
            Assert.Equal(HttpStatusCode.Created, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var songId = body.GetProperty("id").GetInt32();

            resp = await client.PutAsJsonAsync($"/api/library/songs/{songId}", new { Title = "Updated Title" });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync($"/api/library/songs/{songId}");
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("Updated Title", body.GetProperty("title").GetString());

            resp = await client.DeleteAsync($"/api/library/songs/{songId}");
            Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode);

            resp = await client.GetAsync($"/api/library/songs/{songId}");
            Assert.Equal(HttpStatusCode.NotFound, resp.StatusCode);
        }

        // ?? Artist update ??

        [Fact]
        public async Task Artist_Update()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/library/artists", new { Name = "Original Name" });
            Assert.True(resp.IsSuccessStatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var artistId = body.GetProperty("id").GetInt32();

            resp = await client.PutAsJsonAsync($"/api/library/artists/{artistId}", new { Name = "Renamed" });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.GetAsync($"/api/library/artists/{artistId}");
            body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("Renamed", body.GetProperty("name").GetString());
        }

        // ?? Album update + delete ??

        [Fact]
        public async Task Album_UpdateAndDelete()
        {
            var client = AuthClient();

            var resp = await client.PostAsJsonAsync("/api/library/albums", new { Title = "Old Album" });
            Assert.True(resp.IsSuccessStatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            var albumId = body.GetProperty("id").GetInt32();

            resp = await client.PutAsJsonAsync($"/api/library/albums/{albumId}", new { Title = "New Album", ReleaseYear = 2025 });
            Assert.True(resp.IsSuccessStatusCode);

            resp = await client.DeleteAsync($"/api/library/albums/{albumId}");
            Assert.Equal(HttpStatusCode.NoContent, resp.StatusCode);
        }

        // ?? Playlist create ??

        [Fact]
        public async Task Playlist_Create()
        {
            var client = AuthClient();
            var resp = await client.PostAsJsonAsync("/api/library/playlists", new
            {
                Platform = "local",
                Name = "Test Playlist",
                TrackIds = new[] { "track1", "track2" }
            });
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
            var body = await resp.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal(2, body.GetProperty("tracksAdded").GetInt32());
        }
    }
}
