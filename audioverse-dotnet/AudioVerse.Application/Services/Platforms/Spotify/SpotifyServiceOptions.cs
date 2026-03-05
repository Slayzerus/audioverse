namespace AudioVerse.Application.Services.Platforms.Spotify
{
    public class SpotifyServiceOptions
    {
        /// <summary>Spotify Web API base URL.</summary>
        public string ApiBaseUrl { get; set; } = "https://api.spotify.com/v1";
        /// <summary>Spotify Accounts (OAuth) base URL.</summary>
        public string AccountsBaseUrl { get; set; } = "https://accounts.spotify.com";
        /// <summary>OAuth Client Id.</summary>
        public string ClientId { get; set; } = string.Empty;
        /// <summary>OAuth Client Secret.</summary>
        public string ClientSecret { get; set; } = string.Empty;
        /// <summary>Default market (e.g., "PL").</summary>
        public string Market { get; set; } = "PL";
    }
}
