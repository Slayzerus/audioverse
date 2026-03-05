namespace AudioVerse.Application.Models.Platforms.Spotify
{
    public sealed class AddTracksRequest
    {
        // Accept either full URIs (spotify:track:...) or raw IDs, service will normalize.
        public List<string> TrackUrisOrIds { get; set; } = new();
    }
}
