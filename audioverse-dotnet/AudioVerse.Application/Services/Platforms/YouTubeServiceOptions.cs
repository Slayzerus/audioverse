using AudioVerse.Application.Models.Platforms.Tidal;

namespace AudioVerse.Application.Services.Platforms
{
    public class YouTubeServiceOptions
    {
        public string ApiBaseUrl { get; set; } = "https://www.googleapis.com/youtube/v3";
        public string ApiKey { get; set; } = string.Empty; // for public data
        public string? AccessToken { get; set; } // optional OAuth for write / mine endpoints
        public string DefaultPartsVideo { get; set; } = "snippet,contentDetails,statistics";
        public string DefaultPartsPlaylist { get; set; } = "snippet,contentDetails,status";
        public string DefaultPartsChannel { get; set; } = "snippet,statistics";
        public string DefaultPartsPlaylistItems { get; set; } = "snippet,contentDetails";
    }
}
