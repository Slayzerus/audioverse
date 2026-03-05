using AudioVerse.Application.Models.Platforms.Tidal;

namespace AudioVerse.Application.Services.Platforms.Tidal
{
    public sealed class TidalServiceOptions
    {
        /// <summary>Base URL of the TIDAL Web API (or your proxy). Example: https://api.tidalhifi.com/v1</summary>
        public string ApiBaseUrl { get; set; } = "https://api.tidalhifi.com/v1"; // NOTE: adjust to your gateway/proxy.
        public string AuthBaseUrl { get; init; } = "https://auth.tidal.com/v1/oauth2";
        /// <summary>OAuth client identifier.</summary>
        public string ClientId { get; set; } = string.Empty;
        /// <summary>OAuth client secret (if needed; some flows use only ClientId).</summary>
        public string? ClientSecret { get; set; }
        /// <summary>Default country code (e.g., "PL").</summary>
        public string CountryCode { get; set; } = "PL";
        /// <summary>Default audio quality for stream URLs.</summary>
        public SoundQuality DefaultQuality { get; set; } = SoundQuality.HiFi;
    }
}
