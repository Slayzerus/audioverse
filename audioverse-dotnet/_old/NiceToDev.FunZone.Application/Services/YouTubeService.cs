using NiceToDev.FunZone.Application.Interfaces;
using System.Text.Json;

namespace NiceToDev.FunZone.Application.Services
{
    public class YouTubeService : IYouTubeService
    {
        private const string ApiKey = "AIzaSyDVwrzoR3dDMF04w28F_He9WDD2ebW058U"; // Zastąp własnym kluczem API
        private const string SearchUrl = "https://www.googleapis.com/youtube/v3/search";
        private readonly HttpClient _httpClient;

        public YouTubeService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string?> SearchSongAsync(string artist, string title)
        {
            string query = $"{artist} {title} official music video";
            string requestUrl = $"{SearchUrl}?part=snippet&type=video&q={Uri.EscapeDataString(query)}&key={ApiKey}";

            HttpResponseMessage response = await _httpClient.GetAsync(requestUrl);
            if (!response.IsSuccessStatusCode) return null;

            using var responseStream = await response.Content.ReadAsStreamAsync();
            using var jsonDoc = await JsonDocument.ParseAsync(responseStream);

            var items = jsonDoc.RootElement.GetProperty("items");
            if (items.GetArrayLength() == 0) return null;

            string videoId = items[0].GetProperty("id").GetProperty("videoId").GetString()!;
            return videoId;
        }

        public string GetEmbedUrl(string videoId)
        {
            return $"https://www.youtube.com/embed/{videoId}?enablejsapi=1";
        }
    }
}
